import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus, ChevronRight, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import ImageUpload from '../components/ImageUpload'

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const OrderDTF = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Uploaded image state
  const [imagePreview, setImagePreview] = useState(null)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)

  // Natural pixel dimensions of the selected image, used to keep width/height proportional
  const [naturalDims, setNaturalDims] = useState({ width: 0, height: 0 })

  // Editable dimensions (inches). Width defaults to the 22" roll width; height is derived
  // from the image's actual aspect ratio once one is selected.
  const [width, setWidth] = useState(22)
  const [height, setHeight] = useState(0)

  // Which popup is currently open: null | 'size'
  const [openPopup, setOpenPopup] = useState(null)

  // Quantity state
  const [quantity, setQuantity] = useState(1)
  
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

  const handleImageSelect = (imageUrl) => {
    setImagePreview(imageUrl)

    // Load the image off-screen to read its real pixel dimensions, then derive
    // height from the current width using the image's actual aspect ratio.
    const img = new Image()
    img.onload = () => {
      setNaturalDims({ width: img.naturalWidth, height: img.naturalHeight })
      const ratio = img.naturalHeight / img.naturalWidth
      setHeight(Math.round(parseFloat(width || 0) * ratio * 100) / 100)
    }
    img.src = imageUrl
  }

  // Editing width recalculates height (and vice versa) from the image's real aspect ratio
  const handleWidthChange = (value) => {
    setWidth(value)
    if (naturalDims.width && naturalDims.height) {
      const ratio = naturalDims.height / naturalDims.width
      setHeight(Math.round(parseFloat(value || 0) * ratio * 100) / 100)
    }
  }

  const handleHeightChange = (value) => {
    setHeight(value)
    if (naturalDims.width && naturalDims.height) {
      const ratio = naturalDims.width / naturalDims.height
      setWidth(Math.round(parseFloat(value || 0) * ratio * 100) / 100)
    }
  }

  // Preview: the image always fills the fixed preview height, width scales proportionally
  const MAX_PREVIEW_HEIGHT = 220
  const getScaledImageWidth = () => {
    const h = parseFloat(height) || 0
    const w = parseFloat(width) || 0
    if (!h || !w) return 0
    return (w * MAX_PREVIEW_HEIGHT) / h
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

      const requestBody = {
        wholesaleSellerId: parseInt(sellerId),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        size: [],
        selectedFinishConfig: {},
      }

      if (imagePreview) {
        requestBody.imageUrl = imagePreview
      }

      const response = await fetch(`${BACKEND_URL}/api/order/add-to-cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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

  return (
    <div>
      <DashboardNavbar />
      <ImageUpload
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onSelectImage={handleImageSelect}
      />
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
                  <h1 className='text-5xl font-bold text-gray-900 mb-2'>{getLocalizedField(product.name, language, 'Product')}</h1>
                  <p className='text-gray-600'>DTF Transfer 22", {width || 0}" x {height || 0}"</p>
                </div>
                <div className='text-right'>
                  <p className='text-5xl font-bold text-green-500'>${product.basePrice.toFixed(2)}</p>
                  <p className='text-gray-600 text-sm'>{width || 0} linear inch / 24 Hours Production</p>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-6xl mx-auto'>
                {/* Sheet Line Visualization (click anywhere to select the transfer image) */}
                <div className='relative py-6'>
                  {/* Top row: signs count / TOP OF SHEET / LEFT-RIGHT edge labels */}
                  <div className='relative flex items-center justify-between px-6'>
                    <span className='text-sm font-bold text-gray-900'>{imagePreview ? '1' : '0'} signs</span>
                    <div className='flex items-center gap-1'>
                      <ChevronDown size={12} className='text-gray-700' />
                      <span className='text-sm font-bold text-gray-900'>TOP OF SHEET</span>
                      <ChevronDown size={12} className='text-gray-700' />
                    </div>
                    <span className='w-16' />
                  </div>

                  {/* Horizontal sheet line with LEFT/RIGHT edge labels */}
                  <div className='relative flex items-center mt-2'>
                    <div className='flex flex-col items-center gap-0.5 mr-2'>
                      <ChevronRight size={12} className='text-gray-700 rotate-180' />
                      <span className='text-xs font-semibold text-gray-700' style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>LEFT</span>
                      <ChevronRight size={12} className='text-gray-700 rotate-180' />
                    </div>

                    <div className='flex-1 h-0.5 bg-gray-900' />

                    <div className='flex flex-col items-center gap-0.5 ml-2'>
                      <ChevronRight size={12} className='text-gray-700' />
                      <span className='text-xs font-semibold text-gray-700' style={{ writingMode: 'vertical-rl' }}>RIGHT</span>
                      <ChevronRight size={12} className='text-gray-700' />
                    </div>
                  </div>

                  {/* Sheet Info */}
                  <div className='text-center mt-3'>
                    <p className='text-sm text-gray-900'>Sheet #1 / {width || 0}" x {height || 0}" / Front Side</p>
                  </div>

                  {/* Preview: image sits left-aligned against a checkered (transparent) sheet background */}
                  {imagePreview && (
                  <div
                    className='relative w-full overflow-hidden mt-6'
                    style={{
                      height: `${MAX_PREVIEW_HEIGHT}px`,
                      backgroundColor: '#ffffff',
                      backgroundImage:
                        'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                    }}
                  >
                      <img
                        src={imagePreview}
                        alt='DTF transfer artwork'
                        className='absolute top-0 left-0 h-full object-contain'
                        style={{ width: `${getScaledImageWidth()}px`, maxWidth: '100%' }}
                      />
                  </div>
                    )}
                </div>

                {/* Images + Size Boxes */}
                <div className='flex justify-center gap-4'>
                  {/* Images - click to open the image library and select/change the artwork */}
                  <button
                    type='button'
                    onClick={() => setShowImageUploadModal(true)}
                    className='w-64 flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                  >
                    <span className='text-gray-400 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-500 text-white rounded font-bold text-sm'>{imagePreview ? '1' : '0'}</span>
                  </button>

                  {/* Size - click to open editable width/height inputs */}
                  <div className='relative w-64'>
                    <button
                      type='button'
                      onClick={() => setOpenPopup(openPopup === 'size' ? null : 'size')}
                      className='w-full flex items-center justify-between border border-green-600 rounded-lg px-4 py-3 bg-white hover:bg-green-50 transition'
                    >
                      <span className='text-green-600 font-medium text-sm tracking-wide'>SIZE</span>
                      <span className='px-3 py-1 bg-green-600 text-white rounded font-bold text-sm'>
                        {width || 0}" x {height || 0}"
                      </span>
                    </button>

                    {/* Editable size popup */}
                    {openPopup === 'size' && (
                      <div className='absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                        <div className='px-4 py-2 border-b border-gray-200 text-center'>
                          <span className='text-sm text-gray-700'>Size (inches)</span>
                        </div>
                        <div className='px-4 py-3 space-y-3'>
                          <div className='flex items-center gap-2'>
                            <label className='text-sm text-gray-600 w-14'>width:</label>
                            <input
                              type='number'
                              min='0'
                              step='0.1'
                              value={width}
                              onChange={(e) => handleWidthChange(e.target.value)}
                              className='flex-1 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>in</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <label className='text-sm text-gray-600 w-14'>height:</label>
                            <input
                              type='number'
                              min='0'
                              step='0.1'
                              value={height}
                              onChange={(e) => handleHeightChange(e.target.value)}
                              className='flex-1 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>in</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity and Add to Cart */}
                <div className='max-w-md mx-auto bg-white rounded-lg p-6 border border-gray-200 space-y-4 mt-6'>
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

export default OrderDTF