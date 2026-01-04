import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleSuccessfulPayment(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleFailedPayment(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('families')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'active' :
                          subscription.status === 'past_due' ? 'past_due' : 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', subscription.customer as string)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('families')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!family) {
    console.error('Family not found for subscription:', invoice.subscription)
    return
  }

  const periodStart = new Date((invoice.period_start || 0) * 1000).toISOString()
  const periodEnd = new Date((invoice.period_end || 0) * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from('donations')
    .insert({
      family_id: family.id,
      amount: invoice.amount_paid / 100,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      status: 'succeeded',
      receipt_url: invoice.hosted_invoice_url,
      period_start: periodStart,
      period_end: periodEnd,
    })

  if (error) {
    console.error('Error creating donation record:', error)
    throw error
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!family) return

  const { error: familyError } = await supabaseAdmin
    .from('families')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', family.id)

  if (familyError) {
    console.error('Error updating family status:', familyError)
  }

  const periodStart = new Date((invoice.period_start || 0) * 1000).toISOString()
  const periodEnd = new Date((invoice.period_end || 0) * 1000).toISOString()

  await supabaseAdmin
    .from('donations')
    .insert({
      family_id: family.id,
      amount: invoice.amount_due / 100,
      stripe_payment_intent_id: invoice.payment_intent as string || 'failed',
      stripe_invoice_id: invoice.id,
      status: 'failed',
      period_start: periodStart,
      period_end: periodEnd,
    })
}
