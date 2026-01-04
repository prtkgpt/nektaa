import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { familyId } = await req.json()

    if (!familyId) {
      return NextResponse.json(
        { error: 'Missing family ID' },
        { status: 400 }
      )
    }

    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('stripe_subscription_id')
      .eq('id', familyId)
      .single()

    if (familyError || !family || !family.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    await stripe.subscriptions.cancel(family.stripe_subscription_id)

    await supabaseAdmin
      .from('families')
      .update({
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', familyId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
