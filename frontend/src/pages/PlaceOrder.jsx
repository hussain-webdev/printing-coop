import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const PlaceOrder = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const [cartItems, setCartItems] = useState([])
  const [sellerDetails, setSellerDetails] = useState(null)
  const [additionalAddresses, setAdditionalAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  
  const [selectedAddressType, setSelectedAddressType] = useState('current')
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  
  const [shippingCost] = useState(10)
  
  // Form for new address
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phoneNumber: '',
  })

  // Fetch cart and seller details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('sellerToken')
        const sellerId = localStorage.getItem('sellerId')

        if (!token || !sellerId) {
          toast.error(t('placeOrder.title'))
          navigate('/')
          return
        }

        // Fetch cart items
        const cartResponse = await fetch(`${BACKEND_URL}/api/order/seller-cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ wholesaleSellerId: parseInt(sellerId) }),
        })

        const cartData = await cartResponse.json()

        if (!cartData.success) {
          toast.error(t('cart.fetchError'))
          navigate('/cart')
          return
        }

        setCartItems(cartData.cartItems)

        // Fetch seller details
        const sellerResponse = await fetch(`${BACKEND_URL}/api/wholesale-seller/details`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const sellerData = await sellerResponse.json()

        if (sellerData.success) {
          setSellerDetails(sellerData.seller)
        }

        // Load additional addresses from localStorage
        const savedAddresses = localStorage.getItem('additionalAddresses')
        if (savedAddresses) {
          const addresses = JSON.parse(savedAddresses)
          setAdditionalAddresses(addresses)
        }

        setLoading(false)
      } catch (err) {
        console.error('[v0] Error fetching data:', err)
        toast.error(t('common.connectionError'))
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  // Handle add new address
  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipcode || !newAddress.country || !newAddress.phoneNumber) {
      toast.error(t('common.connectionError'))
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
    setSelectedAddressType('additional')
    setSelectedAddressIndex(updated.length - 1)
    toast.success('Address added successfully')
  }

  // Handle delete additional address
  const handleDeleteAddress = (index) => {
    const updated = additionalAddresses.filter((_, i) => i !== index)
    setAdditionalAddresses(updated)
    localStorage.setItem('additionalAddresses', JSON.stringify(updated))
    if (selectedAddressIndex === index) {
      setSelectedAddressType('current')
      setSelectedAddressIndex(null)
    }
    toast.success('Address removed')
  }

  // Get selected address
  const getSelectedAddress = () => {
    if (selectedAddressType === 'current' && sellerDetails) {
      return {
        street: sellerDetails.address,
        city: sellerDetails.city,
        state: sellerDetails.state,
        zipcode: sellerDetails.zipcode,
        country: sellerDetails.country,
        phoneNumber: sellerDetails.phoneNumber,
      }
    } else if (selectedAddressType === 'additional' && selectedAddressIndex !== null) {
      return additionalAddresses[selectedAddressIndex]
    }
    return null
  }

  // Handle place order
  const handlePlaceOrder = async () => {
    try {
      const selectedAddress = getSelectedAddress()

      if (!selectedAddress) {
        toast.error(t('placeOrder.shippingAddress'))
        return
      }

      if (cartItems.length === 0) {
        toast.error(t('cart.empty'))
        return
      }

      const token = localStorage.getItem('sellerToken')
      const sellerId = localStorage.getItem('sellerId')

      setPlacingOrder(true)

      // Prepare order items
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        width: item.width || 0,
        height: item.height || 0,
        size: item.size || [],
        selectedFinishConfig: item.selectedFinishConfig || {},
      }))

      const response = await fetch(`${BACKEND_URL}/api/order/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          shippingCost,
          shippingAddress: selectedAddress,
          orderItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(t('placeOrder.orderSummary'))
        navigate('/order-history')
      } else {
        toast.error(data.message || t('placeOrder.title'))
      }
    } catch (err) {
      console.error('[v0] Error placing order:', err)
      toast.error(t('common.connectionError'))
    } finally {
      setPlacingOrder(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.itemTotal, 0)
  }

  const formatFinishConfig = (config) => {
    if (!config || typeof config !== 'object') return 'Standard'

    return Object.entries(config)
      .map(([key, value]) => {
        // Capitalize the key (convert camelCase/snake_case to Title Case)
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
          .replace(/_/g, ' ') // Replace underscores with spaces
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')

        return `${formattedKey}: ${value}`
      })
      .join(', ')
  }

  const formatSizeDisplay = (item) => {
    // If width and height exist, show dimensions (rounded to 2 decimal places)
    if (item.width && item.height) {
      return `${Number(item.width).toFixed(2)}" x ${Number(item.height).toFixed(2)}"`
    }

    // Otherwise, if size exists, show size array
    if (item.size) {
      try {
        let sizeData = item.size
        // Parse if it's a JSON string
        if (typeof sizeData === 'string') {
          sizeData = JSON.parse(sizeData)
        }
        // If it's an array, join with commas
        if (Array.isArray(sizeData)) {
          return sizeData.join(', ')
        }
        return sizeData
      } catch (e) {
        console.error('[v0] Error parsing size:', e)
        return ''
      }
    }

    // If nothing is available, return empty string (blank space)
    return ''
  }

  if (loading) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 pb-24 flex justify-center items-center py-16'>
          <Loader size={32} className='animate-spin text-gray-600' />
        </div>
        <Footer />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 pb-24'>
          <div className='max-w-7xl mx-auto px-4 py-8'>
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
              <p className='text-gray-700 text-lg mb-4'>{t('cart.empty')}</p>
              <a
                href='/dashboard-banner'
                className='inline-block px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition'
              >
                {t('cart.continueShopping')}
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='max-w-5xl mx-auto px-4 py-8'>
          <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-8'>
            <div className='bg-orange-500 px-6 py-5'>
              <h1 className='text-sm font-bold uppercase tracking-wide text-slate-900'>{t('placeOrder.title')}</h1>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column */}
            <div className='lg:col-span-2 space-y-8'>
              {/* Order Review */}
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('placeOrder.orderReview')}</h2>
                </div>
                <div className='divide-y divide-gray-200'>
                  {cartItems.map((item) => (
                    <div key={item.id} className='px-6 py-4 flex justify-between items-start gap-4'>
                      <div>
                        <p className='font-semibold text-gray-900 text-sm'>{item.product?.name}</p>
                        <p className='text-xs text-gray-500 mt-0.5'>{formatSizeDisplay(item)}</p>
                        <p className='text-xs text-gray-500 mt-0.5'>{formatFinishConfig(item.selectedFinishConfig)}</p>
                      </div>
                      <div className='text-right shrink-0'>
                        <p className='text-xs text-gray-500'>Qty: {item.quantity}</p>
                        <p className='font-semibold text-gray-900 text-sm mt-0.5'>${item.itemTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('placeOrder.shippingAddress')}</h2>
                </div>
                <div className='divide-y divide-gray-200'>
                  {/* Current Address */}
                  <label className='flex items-start gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50 transition'>
                    <input
                      type='radio'
                      name='address'
                      checked={selectedAddressType === 'current'}
                      onChange={() => {
                        setSelectedAddressType('current')
                        setSelectedAddressIndex(null)
                      }}
                      className='mt-1'
                    />
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900 text-sm'>Current Address</p>
                      {sellerDetails && (
                        <p className='text-xs text-gray-500 mt-0.5'>
                          {[
                            sellerDetails.address,
                            [sellerDetails.city, sellerDetails.state, sellerDetails.zipcode].filter(Boolean).join(', '),
                            sellerDetails.country,
                            sellerDetails.phoneNumber,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  </label>

                  {/* Additional Addresses */}
                  {additionalAddresses.map((addr, idx) => (
                    <div key={idx} className='flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition'>
                      <label className='flex items-start gap-3 flex-1 cursor-pointer'>
                        <input
                          type='radio'
                          name='address'
                          checked={selectedAddressType === 'additional' && selectedAddressIndex === idx}
                          onChange={() => {
                            setSelectedAddressType('additional')
                            setSelectedAddressIndex(idx)
                          }}
                          className='mt-1'
                        />
                        <div className='flex-1'>
                          <p className='font-semibold text-gray-900 text-sm'>Additional Address {idx + 1}</p>
                          <p className='text-xs text-gray-500 mt-0.5'>
                            {[
                              addr.street,
                              [addr.city, addr.state, addr.zipcode].filter(Boolean).join(', '),
                              addr.country,
                              addr.phoneNumber,
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                      </label>
                      <button
                        onClick={() => handleDeleteAddress(idx)}
                        aria-label='Delete address'
                        className='p-1 text-gray-500 hover:text-red-600 transition'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Add Address */}
                  <div className='px-6 py-4'>
                    {!showAddAddressForm ? (
                      <button
                        onClick={() => setShowAddAddressForm(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                      >
                        <Plus size={14} />
                        {t('placeOrder.addAddress')}
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
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => setShowAddAddressForm(false)}
                            className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold uppercase tracking-wide rounded hover:bg-gray-50 transition'
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('placeOrder.paymentMethod')}</h2>
                </div>
                <label className='flex items-center gap-3 px-6 py-4 cursor-pointer'>
                  <input
                    type='radio'
                    name='payment'
                    checked={true}
                    readOnly
                  />
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>{t('placeOrder.paymentMethod')}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{t('placeOrder.codDescription')}</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className='lg:col-span-1'>
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm sticky top-40'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('placeOrder.orderSummary')}</h2>
                </div>
                <div className='px-6 py-4'>
                  <div className='space-y-2 mb-4 text-sm'>
                    <div className='flex justify-between text-gray-700'>
                      <span>{t('placeOrder.subtotal')}</span>
                      <span className='font-medium text-gray-900'>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-gray-700'>
                      <span>{t('placeOrder.shipping')}</span>
                      <span className='font-medium text-gray-900'>${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className='border-t border-gray-200 pt-2 flex justify-between items-center'>
                      <span className='font-bold text-gray-900'>{t('cart.total')}</span>
                      <span className='text-lg font-bold text-gray-900'>${(calculateTotal() + shippingCost).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className='w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                  >
                    {placingOrder ? `${t('common.loading')}` : t('placeOrder.title')}
                  </button>

                  <button
                    onClick={() => navigate('/cart')}
                    className='w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                  >
                    {t('placeOrder.backToCart')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PlaceOrder
