import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardNavbar from '../components/DashboardNavbar'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const OrderMisc = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Orientation state
  const [orientation, setOrientation] = useState('portrait')
  
  // Finish config state
  const [selectedConfig, setSelectedConfig] = useState({})
  
  // Quantity state
  const [quantity, setQuantity] = useState(1)

  // Which popup is currently open: null | <finishConfig key>
  const [openPopup, setOpenPopup] = useState(null)
  
  // Loading add to cart
  const [addingToCart, setAddingToCart] = useState(false)

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/product/details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: parseInt(productId) }),
        })

        const data = await response.json()

        if (data.success) {
          setProduct(data.product)
          // Initialize selectedConfig with product finish config keys
          const initialConfig = { orientation: 'portrait' }
          if (data.product.finishConfig && typeof data.product.finishConfig === 'object') {
            Object.keys(data.product.finishConfig).forEach((key) => {
              initialConfig[key] = data.product.finishConfig[key]
            })
          }
          setSelectedConfig(initialConfig)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch product details')
          toast.error('Failed to fetch product')
        }
      } catch (err) {
        console.error('[v0] Error fetching product:', err)
        setError('Connection error. Please try again.')
        toast.error('Connection error')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  // Dimensions based on orientation
  const getDimensions = () => {
    if (orientation === 'portrait') {
      return { width: 2, height: 3.5, label: '2" x 3.5"' }
    } else {
      return { width: 3.5, height: 2, label: '3.5" x 2"' }
    }
  }

  // Handle orientation change
  const handleOrientationChange = (newOrientation) => {
    setOrientation(newOrientation)
    setSelectedConfig({ ...selectedConfig, orientation: newOrientation })
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('sellerToken')
      const sellerId = localStorage.getItem('sellerId')

      if (!token || !sellerId) {
        toast.error('Please login to add to cart')
        navigate('/')
        return
      }

      setAddingToCart(true)

      const dimensions = getDimensions()

      const response = await fetch(`${BACKEND_URL}/api/order/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          productId: parseInt(productId),
          quantity: parseInt(quantity),
          width: dimensions.width,
          height: dimensions.height,
          size: [orientation],
          selectedFinishConfig: selectedConfig,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Product added to cart!')
        navigate('/cart')
      } else {
        toast.error(data.message || 'Failed to add to cart')
      }
    } catch (err) {
      console.error('[v0] Error adding to cart:', err)
      toast.error('Error adding to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 h-screen flex justify-center items-center'>
          <Loader size={32} className='animate-spin text-gray-600' />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 h-screen flex justify-center items-center'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
            <p className='text-red-700'>{error || 'Product not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const dimensions = getDimensions()

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 overflow-x-hidden min-h-screen'>
        {/* Grid Background */}
        <div className='relative bg-[#f0f0f0] min-h-screen'>
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:18px_18px]'></div>

          {/* Content */}
          <div className='relative px-6 py-8'>
            <div className='max-w-7xl mx-auto'>
              {/* Header Section */}
              <div className='flex justify-between items-start mb-8'>
                <div>
                  <h1 className='text-5xl font-bold text-gray-900 mb-2'>{product.name}</h1>
                  <p className='text-gray-600'>{product.name}, {dimensions.label}</p>
                </div>
                <div className='text-right'>
                  <p className='text-5xl font-bold text-green-500'>${product.basePrice.toFixed(2)}</p>
                  <p className='text-gray-600 text-sm'>Premium Quality Product</p>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-4xl mx-auto'>
                {/* Safe Zone / Dimension Display */}
                <div className='bg-white rounded-lg p-8 border border-gray-200 flex flex-col items-center'>
                  {/* Title */}
                  <h3 className='text-center text-gray-900 font-semibold text-sm tracking-wide mb-4'>▼ TOP OF IMAGE ▼</h3>

                  {/* Top width measurement */}
                  <div className='flex items-center gap-2' style={{ width: orientation === 'portrait' ? '160px' : '280px' }}>
                    <span className='text-gray-400 text-xs'>&larr;</span>
                    <div className='flex-1 h-px bg-gray-400' />
                    <span className='text-gray-500 text-xs px-1 whitespace-nowrap'>{dimensions.width}&quot;</span>
                    <div className='flex-1 h-px bg-gray-400' />
                    <span className='text-gray-400 text-xs'>&rarr;</span>
                  </div>

                  {/* Middle row: left height gauge, box, right height gauge */}
                  <div className='flex items-center gap-6 my-2'>
                    {/* Left height measurement */}
                    <div
                      className='flex flex-col items-center gap-1'
                      style={{ height: orientation === 'portrait' ? '280px' : '160px' }}
                    >
                      <span className='text-gray-400 text-xs'>&uarr;</span>
                      <div className='flex-1 w-px bg-gray-400' />
                      <span
                        className='text-gray-500 text-xs whitespace-nowrap'
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {dimensions.height}&quot;
                      </span>
                      <div className='flex-1 w-px bg-gray-400' />
                      <span className='text-gray-400 text-xs'>&darr;</span>
                    </div>

                    {/* Safe Zone Warning */}
                    <div className='border-2 border-red-600 border-dashed p-4 bg-red-50 shrink-0'>
                      <p className='text-red-600 font-semibold text-center text-sm'>
                        Make sure important
                        <br />
                        text and images are
                        <br />
                        within the safe zone.
                      </p>
                    </div>

                    {/* Product Display Box */}
                    <div
                      className='relative transition-all duration-500 ease-out border border-gray-400 bg-white shrink-0'
                      style={{
                        width: orientation === 'portrait' ? '160px' : '280px',
                        height: orientation === 'portrait' ? '280px' : '160px',
                      }}
                    >
                      <div className='absolute inset-3 border-2 border-blue-700 border-dashed' />
                    </div>

                    {/* Right height measurement */}
                    <div
                      className='flex flex-col items-center gap-1'
                      style={{ height: orientation === 'portrait' ? '280px' : '160px' }}
                    >
                      <span className='text-gray-400 text-xs'>&uarr;</span>
                      <div className='flex-1 w-px bg-gray-400' />
                      <span
                        className='text-gray-500 text-xs whitespace-nowrap'
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {dimensions.height}&quot;
                      </span>
                      <div className='flex-1 w-px bg-gray-400' />
                      <span className='text-gray-400 text-xs'>&darr;</span>
                    </div>
                  </div>

                  {/* Bottom width measurement */}
                  <div className='flex items-center gap-2 mb-4' style={{ width: orientation === 'portrait' ? '160px' : '280px' }}>
                    <span className='text-gray-400 text-xs'>&larr;</span>
                    <div className='flex-1 h-px bg-gray-400' />
                    <span className='text-gray-500 text-xs px-1 whitespace-nowrap'>{dimensions.width}&quot;</span>
                    <div className='flex-1 h-px bg-gray-400' />
                    <span className='text-gray-400 text-xs'>&rarr;</span>
                  </div>

                  {/* Bottom Label */}
                  <p className='text-center text-gray-600 text-sm font-medium'>Front Side</p>
                </div>

                {/* Info / Size / Orientation / Config Boxes Row */}
                <div className='relative flex gap-4 mt-4 flex-wrap'>
                  {/* Images (dummy, static) */}
                  <div className='flex-1 min-w-[140px] flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white'>
                    <span className='text-gray-600 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm'>1</span>
                  </div>

                  {/* Size (derived from orientation, display only) */}
                  <div className='flex-1 min-w-[140px] flex items-center justify-between border border-green-600 rounded-lg px-4 py-3 bg-white'>
                    <span className='text-green-600 font-medium text-sm tracking-wide'>SIZE</span>
                    <span className='px-3 py-1 bg-green-600 text-white rounded font-bold text-sm'>{dimensions.label}</span>
                  </div>

                  {/* Landscape / Portrait toggle */}
                  <div className='flex-1 min-w-[200px] flex items-stretch border border-green-600 rounded-lg overflow-hidden bg-white'>
                    <button
                      type='button'
                      onClick={() => handleOrientationChange('landscape')}
                      className={`flex-1 px-4 py-3 font-bold text-sm tracking-wide transition-colors ${
                        orientation === 'landscape' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'
                      }`}
                    >
                      LANDSCAPE
                    </button>
                    <button
                      type='button'
                      onClick={() => handleOrientationChange('portrait')}
                      className={`flex-1 px-4 py-3 font-bold text-sm tracking-wide transition-colors ${
                        orientation === 'portrait' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'
                      }`}
                    >
                      PORTRAIT
                    </button>
                  </div>

                  {/* Finish Config boxes */}
                  {product.finishConfig && Object.entries(product.finishConfig).map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
                    const isBoolean = typeof value === 'boolean'
                    const currentValue = selectedConfig[key] !== undefined ? selectedConfig[key] : value

                    if (isBoolean) {
                      return (
                        <div
                          key={key}
                          className='flex-1 min-w-[160px] flex items-center justify-between border border-green-600 rounded-lg px-4 py-3 bg-white'
                        >
                          <span className='text-green-600 font-medium text-sm tracking-wide'>{label}</span>
                          <button
                            type='button'
                            onClick={() => setSelectedConfig({ ...selectedConfig, [key]: !currentValue })}
                            aria-label={`Toggle ${label}`}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                              currentValue ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                currentValue ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div key={key} className='relative flex-1 min-w-[160px]'>
                        <button
                          type='button'
                          onClick={() => setOpenPopup(openPopup === key ? null : key)}
                          className='w-full flex items-center justify-between border border-green-600 rounded-lg px-4 py-3 bg-white hover:bg-green-50 transition'
                        >
                          <span className='text-green-600 font-medium text-sm tracking-wide'>{label}</span>
                          <span className='px-3 py-1 bg-green-600 text-white rounded font-bold text-sm truncate max-w-[8rem]'>
                            {String(currentValue)}
                          </span>
                        </button>

                        {/* Edit value popup */}
                        {openPopup === key && (
                          <div className='absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                            <div className='px-4 py-2 border-b border-gray-200 text-center'>
                              <span className='text-sm text-gray-700 capitalize'>{label}</span>
                            </div>
                            <div className='px-4 py-3'>
                              <input
                                type='text'
                                value={currentValue}
                                onChange={(e) => setSelectedConfig({ ...selectedConfig, [key]: e.target.value })}
                                className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                                autoFocus
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Quantity and Add to Cart */}
                <div className='bg-white rounded-lg p-6 border border-gray-200 space-y-4 mt-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Quantity</label>
                    <div className='flex items-center gap-2 border border-gray-300 rounded-lg w-40'>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className='p-2 hover:bg-gray-100 transition'
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type='number'
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className='flex-1 px-3 py-2 text-center border-none focus:outline-none'
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className='p-2 hover:bg-gray-100 transition'
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className='w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition disabled:opacity-50'
                  >
                    {addingToCart ? 'Adding to cart...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderMisc