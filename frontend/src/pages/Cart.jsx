import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// Pulls the current language's value out of a { en, fr } field. Falls back to
// English, then to a plain string if the field isn't localized at all (keeps
// this working for any older product data saved before translations were added).
const getLocalizedField = (field, language, fallback) => {
  if (field === null || field === undefined) return fallback
  if (typeof field === 'object' && !Array.isArray(field)) {
    return field[language] ?? field.en ?? fallback
  }
  return field
}

// Most order pages (Banner, Adhesive, Flag, Magnet, Rigid) use a feet+inches size
// picker and store width/height in feet on the cart item. Only DTF and Misc use a
// plain inches input, so their stored width/height is already inches - everything
// else needs the feet -> inches conversion below.
const INCHES_BASED_CATEGORIES = ['apparel', 'misc']

// Formats a number of inches for display - whole numbers show with no decimals,
// fractional ones (e.g. from a non-whole inch entry) keep up to 2 decimal places.
const formatInches = (value) => {
  const rounded = Math.round((value || 0) * 100) / 100
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
}

const Cart = () => {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingItem, setUpdatingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [editingQuantity, setEditingQuantity] = useState({})

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('sellerToken')
      const sellerId = localStorage.getItem('sellerId')

      if (!token || !sellerId) {
        setError(t('cart.pleaseLogin'))
        setLoading(false)
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/order/seller-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ wholesaleSellerId: parseInt(sellerId) }),
      })

      const data = await response.json()

      if (data.success) {
        setCartItems(data.cartItems)
        setError(null)
      } else {
        setError(data.message || t('cart.fetchError'))
        toast.error(t('cart.fetchError'))
      }
    } catch (err) {
      console.error('[v0] Error fetching cart:', err)
      setError(t('common.connectionError'))
      toast.error(t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      toast.error(t('cart.quantityMin'))
      return
    }

    setUpdatingItem(cartItemId)
    try {
      const token = localStorage.getItem('sellerToken')

      const response = await fetch(`${BACKEND_URL}/api/order/update-quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setCartItems(cartItems.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: newQuantity, itemTotal: item.product.basePrice * newQuantity }
            : item
        ))
        setEditingQuantity({ ...editingQuantity, [cartItemId]: undefined })
        toast.success(t('cart.quantityUpdated'))
      } else {
        toast.error(data.message || t('cart.quantityUpdateFailed'))
      }
    } catch (err) {
      console.error('[v0] Error updating quantity:', err)
      toast.error(t('cart.quantityUpdateError'))
    } finally {
      setUpdatingItem(null)
    }
  }

  const handleDeleteItem = async (cartItemId) => {
    setDeletingItem(cartItemId)
    try {
      const token = localStorage.getItem('sellerToken')

      const response = await fetch(`${BACKEND_URL}/api/order/delete-cart-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItemId }),
      })

      const data = await response.json()

      if (data.success) {
        setCartItems(cartItems.filter((item) => item.id !== cartItemId))
        toast.success(t('cart.itemRemoved'))
      } else {
        toast.error(data.message || t('cart.removeFailed'))
      }
    } catch (err) {
      console.error('[v0] Error deleting item:', err)
      toast.error(t('cart.removeError'))
    } finally {
      setDeletingItem(null)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.itemTotal, 0)
  }

  const formatFinishConfig = (config) => {
    if (!config || typeof config !== 'object') return t('common.standard')
    
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
    // If width and height exist, show dimensions converted to inches
    if (item.width && item.height) {
      const isFeetBased = !INCHES_BASED_CATEGORIES.includes(item.product?.category)
      const widthInches = isFeetBased ? Number(item.width) * 12 : Number(item.width)
      const heightInches = isFeetBased ? Number(item.height) * 12 : Number(item.height)
      return `${formatInches(widthInches)}" x ${formatInches(heightInches)}"`
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

  if (error) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 pb-24 max-w-7xl mx-auto px-4 py-8'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
            <p className='text-red-700'>{error}</p>
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
        <div className='max-w-7xl mx-auto px-4 py-8'>
          {cartItems.length > 0 ? (
            <div className='bg-white rounded-lg shadow p-6 sm:p-8'>
              {/* Header */}
              <h1 className='text-3xl font-bold text-gray-900 mb-8'>{t('cart.title')}</h1>

              {/* Column labels */}
              <div className='grid grid-cols-[3fr_1.2fr_1.4fr_0.8fr_0.8fr_0.8fr] gap-4 pb-3 border-b border-gray-200 text-sm font-semibold text-gray-900'>
                <div>{t('cart.product')}</div>
                <div>{t('common.size')}</div>
                <div>{t('cart.options')}</div>
                <div>{t('common.quantity')}</div>
                <div>{t('common.price')}</div>
                <div className='text-right'>{t('cart.action')}</div>
              </div>

              {/* Items */}
              {cartItems.map((item) => (
                <div key={item.id} className='border-b border-gray-200 py-4'>
                  <div className='grid grid-cols-[3fr_1.2fr_1.4fr_0.8fr_0.8fr_0.8fr] gap-4 items-start'>
                    {/* Product name */}
                    <div>
                      <p className='font-medium text-gray-900'>{getLocalizedField(item.product?.name, language, '')}</p>
                      <p className='text-sm text-gray-600 mt-1'>{getLocalizedField(item.product?.materials, language, '')}</p>
                    </div>

                    {/* Size */}
                    <div className='text-sm text-gray-900'>{formatSizeDisplay(item)}</div>

                    {/* Options */}
                    <div className='text-sm text-gray-900'>{formatFinishConfig(item.selectedFinishConfig)}</div>

                    {/* Quantity */}
                    <div>
                      {editingQuantity[item.id] !== undefined ? (
                        <div className='flex items-center gap-2'>
                          <input
                            type='number'
                            min='1'
                            value={editingQuantity[item.id]}
                            onChange={(e) =>
                              setEditingQuantity({
                                ...editingQuantity,
                                [item.id]: parseInt(e.target.value),
                              })
                            }
                            className='w-16 px-2 py-1 border border-gray-300 rounded text-sm'
                          />
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, editingQuantity[item.id])
                            }
                            disabled={updatingItem === item.id}
                            className='px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs disabled:opacity-50'
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      ) : (
                        <span className='text-sm text-gray-900'>{item.quantity}</span>
                      )}
                    </div>

                    {/* Price */}
                    <div className='text-sm text-gray-900'>${item.itemTotal.toFixed(2)}</div>

                    {/* Actions */}
                    <div className='flex flex-col items-end gap-2'>
                      <button
                        onClick={() =>
                          setEditingQuantity({
                            ...editingQuantity,
                            [item.id]: item.quantity,
                          })
                        }
                        disabled={editingQuantity[item.id] !== undefined}
                        className='px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs uppercase tracking-wide disabled:opacity-50 transition'
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItem === item.id}
                        className='px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded text-xs uppercase tracking-wide disabled:opacity-50 transition'
                      >
                        {t('common.remove')}
                      </button>
                    </div>
                  </div>

                  {/* Cart item images - duplicate URLs (e.g. rigid products with up to 10
                      cells but repeated images) are grouped and shown once with a "x N" badge */}
                  {item.images && item.images.length > 0 && (
                    <div className='mt-4'>
                      <div className='flex gap-3 flex-wrap'>
                        {Object.values(
                          item.images.reduce((acc, image) => {
                            const key = image.url
                            if (!acc[key]) {
                              acc[key] = { url: image.url, count: 0 }
                            }
                            acc[key].count += 1
                            return acc
                          }, {})
                        ).map((groupedImage, index) => (
                          <div key={index} className='relative'>
                            <img
                              src={groupedImage.url}
                              alt={`${getLocalizedField(item.product?.name, language, 'Product')} - Image ${index + 1}`}
                              className='h-28'
                            />
                            {groupedImage.count > 1 && (
                              <span className='absolute bottom-1 right-1 bg-black/70 text-white text-xs font-semibold px-1.5 py-0.5 rounded'>
                                x {groupedImage.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Total + actions */}
              <div className='flex flex-col items-end gap-3 pt-6'>
                <p className='text-lg font-bold text-gray-900'>
                  {t('cart.total')}: ${calculateTotal().toFixed(2)}
                </p>
                  <button
                    onClick={() => navigate('/place-order')}
                    className='px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded text-xs uppercase tracking-wide transition'
                  >
                    {t('common.checkout')}
                  </button>
              </div>
            </div>
          ) : (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
              <p className='text-gray-700 text-lg mb-4'>{t('cart.empty')}</p>
              <p className='text-gray-600 mb-6'>{t('cart.emptySubtitle')}</p>
              <a
                href='/dashboard-banner'
                className='inline-block px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition'
              >
                {t('cart.continueShopping')}
              </a>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Cart