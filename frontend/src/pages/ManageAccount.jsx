import React, { useState, useEffect } from 'react'
import { Loader, Pencil, Trash2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const ManageAccount = () => {
  const { t } = useTranslation()
  const [sellerData, setSellerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Additional shipping addresses stored in localStorage (shared with PlaceOrder.jsx)
  const [additionalAddresses, setAdditionalAddresses] = useState([])
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phoneNumber: '',
  })

  // Editing an existing additional (localStorage) address
  const [editingAddressIndex, setEditingAddressIndex] = useState(null)
  const [editAddressData, setEditAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phoneNumber: '',
  })

  // Edit wholesale seller profile (name, email, phone, address, etc.) via PUT /edit-profile
  const [showEditProfileForm, setShowEditProfileForm] = useState(false)
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    address: '',
    address2: '',
    country: '',
    city: '',
    state: '',
    zipcode: '',
    website: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        const token = localStorage.getItem('sellerToken')
        const email = localStorage.getItem('sellerEmail')

        if (!token || !email) {
          setError(t('cart.pleaseLogin'))
          setLoading(false)
          return
        }

        const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/details`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (data.success) {
          setSellerData(data.seller)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch seller details')
          toast.error(data.message || 'Failed to fetch seller details')
        }
      } catch (err) {
        console.error('[v0] Error fetching seller details:', err)
        setError('Connection error. Please check your backend server.')
        toast.error('Connection error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchSellerDetails()

    // Load additional addresses from localStorage (same key used by PlaceOrder.jsx)
    const savedAddresses = localStorage.getItem('additionalAddresses')
    if (savedAddresses) {
      try {
        setAdditionalAddresses(JSON.parse(savedAddresses))
      } catch (err) {
        console.error('[v0] Error parsing saved addresses:', err)
      }
    }
  }, [])

  // Handle add new address - persists to localStorage so it's also picked up by PlaceOrder.jsx
  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipcode || !newAddress.country || !newAddress.phoneNumber) {
      toast.error('Please fill all fields')
      return
    }

    const updated = [...additionalAddresses, newAddress]
    setAdditionalAddresses(updated)
    localStorage.setItem('additionalAddresses', JSON.stringify(updated))
    setNewAddress({
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      phoneNumber: '',
    })
    setShowAddAddressForm(false)
    toast.success('Address added successfully')
  }

  // Handle delete additional address
  const handleDeleteAddress = (index) => {
    const updated = additionalAddresses.filter((_, i) => i !== index)
    setAdditionalAddresses(updated)
    localStorage.setItem('additionalAddresses', JSON.stringify(updated))
    toast.success('Address removed')
  }

  // Start editing an additional (localStorage) address
  const handleStartEditAddress = (index) => {
    setEditingAddressIndex(index)
    setEditAddressData({ ...additionalAddresses[index] })
    setShowAddAddressForm(false)
  }

  // Cancel editing an additional address
  const handleCancelEditAddress = () => {
    setEditingAddressIndex(null)
  }

  // Save changes to an additional address - persists to localStorage so it's also picked up by PlaceOrder.jsx
  const handleSaveEditAddress = () => {
    if (!editAddressData.street || !editAddressData.city || !editAddressData.state || !editAddressData.zipcode || !editAddressData.country || !editAddressData.phoneNumber) {
      toast.error('Please fill all fields')
      return
    }

    const updated = [...additionalAddresses]
    updated[editingAddressIndex] = editAddressData
    setAdditionalAddresses(updated)
    localStorage.setItem('additionalAddresses', JSON.stringify(updated))
    setEditingAddressIndex(null)
    toast.success('Address updated successfully')
  }

  // Open the edit-profile form, pre-filled with the seller's current details
  const handleOpenEditProfile = () => {
    setEditProfileData({
      name: sellerData.name || '',
      email: sellerData.email || '',
      phoneNumber: sellerData.phoneNumber || '',
      companyName: sellerData.companyName || '',
      address: sellerData.address || '',
      address2: sellerData.address2 || '',
      country: sellerData.country || '',
      city: sellerData.city || '',
      state: sellerData.state || '',
      zipcode: sellerData.zipcode || '',
      website: sellerData.website || '',
    })
    setShowEditProfileForm(true)
  }

  // Handle edit wholesale seller profile - PUT /api/wholesale-seller/edit-profile
  const handleEditProfile = async () => {
    try {
      const token = localStorage.getItem('sellerToken')

      if (!token) {
        toast.error('Please login to edit your account')
        return
      }

      if (
        !editProfileData.name ||
        !editProfileData.email ||
        !editProfileData.phoneNumber ||
        !editProfileData.companyName ||
        !editProfileData.address ||
        !editProfileData.country ||
        !editProfileData.city ||
        !editProfileData.state ||
        !editProfileData.zipcode
      ) {
        toast.error('Please fill all required fields')
        return
      }

      setSavingProfile(true)

      const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/edit-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editProfileData),
      })

      const data = await response.json()

      if (data.success) {
        setSellerData(data.seller)
        // Keep the cached email in sync since it's used elsewhere to identify the seller
        localStorage.setItem('sellerEmail', data.seller.email)
        setShowEditProfileForm(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('[v0] Error updating profile:', err)
      toast.error('Error updating profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatAddress = (seller) => {
    const parts = [
      seller.address,
      seller.address2,
      [seller.city, seller.state, seller.zipcode].filter(Boolean).join(', '),
      seller.country,
    ].filter(Boolean)
    return parts.join(' • ')
  }

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        {loading ? (
          <div className='flex justify-center items-center py-16'>
            <Loader size={32} className='animate-spin text-gray-600' />
          </div>
        ) : error ? (
          <div className='max-w-4xl mx-auto px-6 py-8'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <p className='text-red-700'>{error}</p>
            </div>
          </div>
        ) : sellerData ? (
          <div className='max-w-4xl mx-auto px-4 sm:px-6 py-8'>
            <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
              {/* Header */}
              <div className='bg-orange-500 px-6 py-5'>
                <h1 className='text-sm font-bold uppercase tracking-wide text-slate-900'>{t('manageAccount.title')}</h1>
              </div>

              {/* Users */}
              <div className='bg-black px-6 py-2.5'>
                <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('manageAccount.users')}</h2>
              </div>
              <div className='divide-y divide-gray-200'>
                <div className='flex items-center justify-between px-6 py-4'>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>{sellerData.name}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{sellerData.email}</p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='px-3 py-1.5 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wide rounded'>
                      {t('manageAccount.default')}
                    </span>
                    <button onClick={handleOpenEditProfile} aria-label='Edit profile' className='text-gray-500 hover:text-gray-700'>
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Shipping Addresses */}
              <div className='bg-black px-6 py-2.5'>
                <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('manageAccount.shippingAddresses')}</h2>
              </div>
              <div className='divide-y divide-gray-200'>
                <div className='flex items-center justify-between px-6 py-4'>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>{sellerData.companyName}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{formatAddress(sellerData)}</p>
                  </div>
                  <button onClick={handleOpenEditProfile} aria-label='Edit primary address' className='p-1 text-gray-500 hover:text-gray-700 transition'>
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Additional addresses saved from localStorage */}
                {additionalAddresses.map((addr, idx) => (
                  <div key={idx} className='px-6 py-4'>
                    {editingAddressIndex === idx ? (
                      <div className='border border-gray-200 rounded-lg p-4 space-y-3 max-w-md'>
                        <input
                          type='text'
                          placeholder='Street Address'
                          value={editAddressData.street}
                          onChange={(e) => setEditAddressData({ ...editAddressData, street: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <input
                          type='text'
                          placeholder='City'
                          value={editAddressData.city}
                          onChange={(e) => setEditAddressData({ ...editAddressData, city: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <input
                          type='text'
                          placeholder='State'
                          value={editAddressData.state}
                          onChange={(e) => setEditAddressData({ ...editAddressData, state: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <input
                          type='text'
                          placeholder='Zip Code'
                          value={editAddressData.zipcode}
                          onChange={(e) => setEditAddressData({ ...editAddressData, zipcode: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <input
                          type='text'
                          placeholder='Country'
                          value={editAddressData.country}
                          onChange={(e) => setEditAddressData({ ...editAddressData, country: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <input
                          type='tel'
                          placeholder='Phone Number'
                          value={editAddressData.phoneNumber}
                          onChange={(e) => setEditAddressData({ ...editAddressData, phoneNumber: e.target.value })}
                          className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                        />
                        <div className='flex gap-2'>
                          <button
                            onClick={handleSaveEditAddress}
                            className='flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                          >
                            {t('manageAccount.saveChanges')}
                          </button>
                          <button
                            onClick={handleCancelEditAddress}
                            className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide rounded hover:bg-gray-50 transition'
                          >
                            {t('manageAccount.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-semibold text-gray-900 text-sm'>Additional Address {idx + 1}</p>
                          <p className='text-xs text-gray-500 mt-0.5'>
                            {[addr.street, [addr.city, addr.state, addr.zipcode].filter(Boolean).join(', '), addr.country, addr.phoneNumber]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <button
                            onClick={() => handleStartEditAddress(idx)}
                            aria-label='Edit address'
                            className='p-1 text-gray-500 hover:text-gray-700 transition'
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(idx)}
                            aria-label='Delete address'
                            className='p-1 text-gray-500 hover:text-red-600 transition'
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Address */}
                <div className='px-6 py-4'>
                  {!showAddAddressForm ? (
                    <button
                      onClick={() => {
                        setEditingAddressIndex(null)
                        setShowAddAddressForm(true)
                      }}
                      className='flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                    >
                      <Plus size={14} />
                      {t('manageAccount.addAddress')}
                    </button>
                  ) : (
                    <div className='border border-gray-200 rounded-lg p-4 space-y-3 max-w-md'>
                      <input
                        type='text'
                        placeholder='Street Address'
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <input
                        type='text'
                        placeholder='City'
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <input
                        type='text'
                        placeholder='State'
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <input
                        type='text'
                        placeholder='Zip Code'
                        value={newAddress.zipcode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipcode: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <input
                        type='text'
                        placeholder='Country'
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <input
                        type='tel'
                        placeholder='Phone Number'
                        value={newAddress.phoneNumber}
                        onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                        className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      />
                      <div className='flex gap-2'>
                        <button
                          onClick={handleAddAddress}
                          className='flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                        >
                          {t('manageAccount.saveAddress')}
                        </button>
                        <button
                          onClick={() => setShowAddAddressForm(false)}
                          className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide rounded hover:bg-gray-50 transition'
                        >
                          {t('manageAccount.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className='bg-black px-6 py-2.5'>
                <h2 className='text-xs font-bold uppercase tracking-wide text-white'>Contact</h2>
              </div>
              <div className='divide-y divide-gray-200'>
                <div className='flex items-center justify-between px-6 py-4'>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>{sellerData.companyName}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{sellerData.phoneNumber}</p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <button onClick={handleOpenEditProfile} aria-label='Edit contact' className='text-gray-500 hover:text-gray-700'>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => {}} aria-label='Delete contact' className='text-gray-500 hover:text-gray-700'>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className='px-6 py-4'>
                  <button
                    onClick={() => {}}
                    className='px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Profile Modal - edits name, email, phone, company, and address via PUT /edit-profile */}
      {showEditProfileForm && (
        <div
          className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4'
          onClick={() => setShowEditProfileForm(false)}
        >
          <div
            className='bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between'>
              <h3 className='text-sm font-bold uppercase tracking-wide text-gray-900'>Edit Profile</h3>
              <button
                onClick={() => setShowEditProfileForm(false)}
                aria-label='Close'
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={20} />
              </button>
            </div>

            <div className='px-6 py-4 space-y-3'>
              <input
                type='text'
                placeholder='Name'
                value={editProfileData.name}
                onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
              <input
                type='email'
                placeholder='Email'
                value={editProfileData.email}
                onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
              <input
                type='tel'
                placeholder='Phone Number'
                value={editProfileData.phoneNumber}
                onChange={(e) => setEditProfileData({ ...editProfileData, phoneNumber: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
              <input
                type='text'
                placeholder='Company Name'
                value={editProfileData.companyName}
                onChange={(e) => setEditProfileData({ ...editProfileData, companyName: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
              <input
                type='text'
                placeholder='Website (optional)'
                value={editProfileData.website}
                onChange={(e) => setEditProfileData({ ...editProfileData, website: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />

              <div className='pt-2 border-t border-gray-100'>
                <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2'>Address</p>
                <div className='space-y-3'>
                  <input
                    type='text'
                    placeholder='Street Address'
                    value={editProfileData.address}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                  />
                  <input
                    type='text'
                    placeholder='Address Line 2 (optional)'
                    value={editProfileData.address2}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address2: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                  />
                  <div className='flex gap-3'>
                    <input
                      type='text'
                      placeholder='City'
                      value={editProfileData.city}
                      onChange={(e) => setEditProfileData({ ...editProfileData, city: e.target.value })}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    />
                    <input
                      type='text'
                      placeholder='State'
                      value={editProfileData.state}
                      onChange={(e) => setEditProfileData({ ...editProfileData, state: e.target.value })}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    />
                  </div>
                  <div className='flex gap-3'>
                    <input
                      type='text'
                      placeholder='Zip Code'
                      value={editProfileData.zipcode}
                      onChange={(e) => setEditProfileData({ ...editProfileData, zipcode: e.target.value })}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    />
                    <input
                      type='text'
                      placeholder='Country'
                      value={editProfileData.country}
                      onChange={(e) => setEditProfileData({ ...editProfileData, country: e.target.value })}
                      className='flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex gap-2'>
              <button
                onClick={handleEditProfile}
                disabled={savingProfile}
                className='flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition disabled:opacity-50'
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditProfileForm(false)}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide rounded hover:bg-gray-50 transition'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ManageAccount
