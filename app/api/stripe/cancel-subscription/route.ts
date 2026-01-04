import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase-admin'
import { Family } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const { familyId } = await req.json()

    if (!familyId) {
      return NextResponse.json(
        { error: 'Missing family ID' },
        { status: 400 }
      )
    }

    const familyDoc = await adminDb.collection('families').doc(familyId).get()

    if (!familyDoc.exists) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const family = familyDoc.data() as Family

    if (!family.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    await stripe.subscriptions.cancel(family.stripe_subscription_id)

    await familyDoc.ref.update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
