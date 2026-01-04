'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Family, Donation } from '@/types/database'

export default function DashboardPage() {
  const [family, setFamily] = useState<Family | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/login')
        return
      }

      await loadFamilyData(user.uid)
    })

    return () => unsubscribe()
  }, [router])

  const loadFamilyData = async (userId: string) => {
    try {
      const familyDoc = await getDoc(doc(db, 'families', userId))

      if (familyDoc.exists()) {
        const familyData = { id: familyDoc.id, ...familyDoc.data() } as Family
        setFamily(familyData)
        await loadDonations(familyDoc.id)
      }
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDonations = async (familyId: string) => {
    try {
      const donationsRef = collection(db, 'donations')
      const q = query(
        donationsRef,
        where('family_id', '==', familyId),
        orderBy('created_at', 'desc'),
        limit(10)
      )

      const snapshot = await getDocs(q)
      const donationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[]

      setDonations(donationsList)
    } catch (error) {
      console.error('Error loading donations:', error)
    }
  }

  const handleSetupSubscription = async () => {
    if (!family) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          monthlyAmount: family.monthly_amount,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create checkout session')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!family || !confirm('Are you sure you want to cancel your subscription?')) return

    setActionLoading(true)
    try {
      await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: family.id }),
      })

      alert('Subscription cancelled successfully')
      if (auth.currentUser) {
        await loadFamilyData(auth.currentUser.uid)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No family profile found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Family Donation Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {family.is_admin && (
                <a
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Admin Dashboard
                </a>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Family Profile</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Family Name</p>
                  <p className="text-lg font-medium">{family.family_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Email</p>
                  <p className="text-lg font-medium">{family.contact_email}</p>
                </div>
                {family.contact_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-lg font-medium">{family.contact_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Monthly Amount</p>
                  <p className="text-lg font-medium">${family.monthly_amount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Subscription Status</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    family.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    family.subscription_status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                    family.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {family.subscription_status.charAt(0).toUpperCase() + family.subscription_status.slice(1)}
                  </span>
                </div>

                {family.subscription_status === 'inactive' || family.subscription_status === 'cancelled' ? (
                  <button
                    onClick={handleSetupSubscription}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Setup Monthly Donation'}
                  </button>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Donations</h2>
            {donations.length === 0 ? (
              <p className="text-gray-500">No donations yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donations.map((donation) => (
                      <tr key={donation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${donation.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            donation.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            donation.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {donation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {donation.receipt_url && (
                            <a
                              href={donation.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View Receipt
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
