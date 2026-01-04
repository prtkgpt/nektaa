import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { Family } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const { familyId, monthlyAmount } = await req.json()

    if (!familyId || !monthlyAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const familyDoc = await adminDb.collection('families').doc(familyId).get()

    if (!familyDoc.exists) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      )
    }

    const family = familyDoc.data() as Family
    let customerId = family.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: family.contact_email,
        name: family.family_name,
        metadata: {
          family_id: familyId,
        },
      })
      customerId = customer.id

      await familyDoc.ref.update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Monthly Donation',
              description: `Monthly contribution from ${family.family_name}`,
            },
            unit_amount: Math.round(monthlyAmount * 100),
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        family_id: familyId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
