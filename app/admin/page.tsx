'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Family, Donation } from '@/types/database'

interface FamilyWithDonations extends Family {
  total_donations: number
  last_donation_date: string | null
}

export default function AdminPage() {
  const [families, setFamilies] = useState<FamilyWithDonations[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'families' | 'donations'>('families')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/login')
        return
      }

      await checkAdmin(user.uid)
    })

    return () => unsubscribe()
  }, [router])

  const checkAdmin = async (userId: string) => {
    try {
      const familyDoc = await getDoc(doc(db, 'families', userId))

      if (!familyDoc.exists() || !familyDoc.data()?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadData()
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/dashboard')
    }
  }

  const loadData = async () => {
    try {
      const familiesSnapshot = await getDocs(collection(db, 'families'))
      const donationsSnapshot = await getDocs(
        query(
          collection(db, 'donations'),
          orderBy('created_at', 'desc'),
          firestoreLimit(50)
        )
      )

      const familiesList = familiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Family[]

      const donationsList = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[]

      const familiesWithStats: FamilyWithDonations[] = await Promise.all(
        familiesList.map(async (family) => {
          const familyDonationsQuery = query(
            collection(db, 'donations'),
            where('family_id', '==', family.id),
            where('status', '==', 'succeeded'),
            orderBy('created_at', 'desc')
          )

          const familyDonationsSnapshot = await getDocs(familyDonationsQuery)
          const familyDonations = familyDonationsSnapshot.docs.map(doc => doc.data() as Donation)

          const totalDonations = familyDonations.reduce((sum, d) => sum + Number(d.amount), 0)
          const lastDonationDate = familyDonations.length > 0 ? familyDonations[0].created_at : null

          return {
            ...family,
            total_donations: totalDonations,
            last_donation_date: lastDonationDate
          }
        })
      )

      setFamilies(familiesWithStats)
      setDonations(donationsList)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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

  if (!isAdmin) {
    return null
  }

  const totalMonthlyRevenue = families
    .filter(f => f.subscription_status === 'active')
    .reduce((sum, f) => sum + Number(f.monthly_amount), 0)

  const totalCollected = donations
    .filter(d => d.status === 'succeeded')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                My Dashboard
              </a>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Families
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {families.length}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Monthly Revenue (Active)
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ${totalMonthlyRevenue.toFixed(2)}
                </dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Collected
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ${totalCollected.toFixed(2)}
                </dd>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('families')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'families'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Families ({families.length})
                </button>
                <button
                  onClick={() => setActiveTab('donations')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'donations'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Recent Donations ({donations.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'families' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Family Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Donated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Donation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {families.map((family) => (
                        <tr key={family.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {family.family_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {family.contact_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${family.monthly_amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              family.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                              family.subscription_status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                              family.subscription_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {family.subscription_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${family.total_donations.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {family.last_donation_date
                              ? new Date(family.last_donation_date).toLocaleDateString()
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                          Period
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(donation.period_start).toLocaleDateString()} -{' '}
                            {new Date(donation.period_end).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {donation.receipt_url && (
                              <a
                                href={donation.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View
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
        </div>
      </main>
    </div>
  )
}
