import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardNavbar from '../components/DashboardNavbar'
import ImageUpload from '../components/ImageUpload'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const OrderAdhesive = () => {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Uploaded image state
  const [imagePreview, setImagePreview] = useState(null)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)
  
  // Dimensions state
  const [widthFt, setWidthFt] = useState(0)
  const [widthIn, setWidthIn] = useState(0)
  const [heightFt, setHeightFt] = useState(0)
  const [heightIn, setHeightIn] = useState(0)
  
  // Finish config state
  const [selectedConfig, setSelectedConfig] = useState({})

  // How the uploaded image is positioned within its dimensions: 'fit' | 'center'
  const [imageFit, setImageFit] = useState('fit')
  
  // Quantity state
  const [quantity, setQuantity] = useState(1)

  // Which popup is currently open: null | 'size' | <finishConfig key>
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
          const initialConfig = { imageFit: 'fit' }
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

  // Calculate total dimensions
  const getTotalWidth = () => parseFloat(widthFt) + parseFloat(widthIn) / 12
  const getTotalHeight = () => parseFloat(heightFt) + parseFloat(heightIn) / 12
  const getDimensionString = () => {
    const w = getTotalWidth()
    const h = getTotalHeight()
    return `${w.toFixed(2)}" x ${h.toFixed(2)}"`
  }

  // Each active finish config option adds a flat surcharge to the base price:
  // - boolean options add the surcharge only when set to true
  // - other options add the surcharge whenever they hold a non-empty value
  const CONFIG_SURCHARGE = 2.5

  const getConfigSurcharge = () => {
    if (!product?.finishConfig) return 0

    return Object.entries(product.finishConfig).reduce((total, [key, originalValue]) => {
      const currentValue = selectedConfig[key] !== undefined ? selectedConfig[key] : originalValue
      const isBoolean = typeof originalValue === 'boolean'

      if (isBoolean) {
        return currentValue === true ? total + CONFIG_SURCHARGE : total
      }

      const hasValue = currentValue !== '' && currentValue !== null && currentValue !== undefined
      return hasValue ? total + CONFIG_SURCHARGE : total
    }, 0)
  }

  const getAdjustedBasePrice = () => (product ? product.basePrice + getConfigSurcharge() : 0)

  const handleImageSelect = (imageUrl) => {
    setImagePreview(imageUrl)
  }

  const handleImageFitChange = (newFit) => {
    setImageFit(newFit)
    setSelectedConfig({ ...selectedConfig, imageFit: newFit })
  }

  // Scales the actual sign dimensions down into a bounded preview box,
  // preserving aspect ratio, so the preview matches real proportions.
  const MAX_PREVIEW_SIZE = 340
  const getPreviewBoxDimensions = () => {
    const w = getTotalWidth()
    const h = getTotalHeight()

    if (!w || !h || Number.isNaN(w) || Number.isNaN(h)) {
      return { width: MAX_PREVIEW_SIZE, height: MAX_PREVIEW_SIZE }
    }

    const aspect = w / h
    if (aspect >= 1) {
      return { width: MAX_PREVIEW_SIZE, height: MAX_PREVIEW_SIZE / aspect }
    }
    return { width: MAX_PREVIEW_SIZE * aspect, height: MAX_PREVIEW_SIZE }
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

      if (!widthFt && !widthIn && !heightFt && !heightIn) {
        toast.error('Please specify dimensions')
        return
      }

      setAddingToCart(true)

      const requestBody = {
        wholesaleSellerId: parseInt(sellerId),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        width: getTotalWidth(),
        height: getTotalHeight(),
        size: [widthFt ? `${widthFt}ft` : '', widthIn ? `${widthIn}in` : '', heightFt ? `${heightFt}ft` : '', heightIn ? `${heightIn}in` : ''].filter(Boolean),
        selectedFinishConfig: selectedConfig,
        basePrice: getAdjustedBasePrice(),
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
                  <h1 className='text-5xl font-bold text-gray-900 mb-2'>{product.name}</h1>
                  <p className='text-gray-600'>{product.name} Adhesive, {getDimensionString()}</p>
                </div>
                <div className='text-right'>
                  <p className='text-5xl font-bold text-green-500'>${getAdjustedBasePrice().toFixed(2)}</p>
                  <p className='text-gray-600 text-sm'>0 sqft / 24 Hours Production</p>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-4xl mx-auto'>
                {/* Image Upload / Preview */}
                {!imagePreview ? (
                  <div
                    onClick={() => setShowImageUploadModal(true)}
                    className='relative border-2 border-dashed border-gray-400 rounded-lg h-96 flex flex-col items-center justify-center bg-white/60 cursor-pointer hover:bg-white/80 transition'
                  >
                    <p className='text-gray-400 text-lg tracking-wide'>PLEASE SPECIFY DIMENSIONS OR</p>
                    <p className='text-gray-400 text-lg tracking-wide mb-8'>CLICK TO SELECT AN IMAGE</p>
                    <svg className='w-16 h-16 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                  </div>
                ) : (
                  <div className='flex flex-col items-center py-4'>
                    {/* Top label */}
                    <div className='flex items-center gap-1 mb-2'>
                      <ChevronDown size={12} className='text-gray-700' />
                      <span className='text-sm font-bold text-gray-900'>TOP OF IMAGE</span>
                      <ChevronDown size={12} className='text-gray-700' />
                    </div>

                    {/* Top width ruler */}
                    <div className='flex items-center gap-1' style={{ width: `${getPreviewBoxDimensions().width}px` }}>
                      <ChevronLeft size={12} className='text-gray-400' />
                      <div className='flex-1 border-t border-gray-400' />
                      <ChevronRight size={12} className='text-gray-400' />
                    </div>
                    <span className='text-xs text-gray-500 mb-1'>{getTotalWidth().toFixed(2)}"</span>

                    <div className='flex items-center gap-2'>
                      {/* Left height ruler */}
                      <div className='flex flex-col items-center gap-1' style={{ height: `${getPreviewBoxDimensions().height}px` }}>
                        <ChevronUp size={12} className='text-gray-400' />
                        <div className='flex-1 border-l border-gray-400' />
                        <ChevronDown size={12} className='text-gray-400' />
                      </div>
                      <span className='text-xs text-gray-500' style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {getTotalHeight().toFixed(2)}"
                      </span>

                      {/* Image with safe-zone outline - sized to actual proportions, live-updating */}
                      <div
                        className='relative border border-gray-800 bg-gray-100 overflow-hidden transition-all duration-300 ease-out'
                        style={{ width: `${getPreviewBoxDimensions().width}px`, height: `${getPreviewBoxDimensions().height}px` }}
                      >
                        <img
                          src={imagePreview}
                          alt='Uploaded artwork'
                          className={imageFit === 'fit' ? 'w-full h-full object-contain' : 'w-full h-full'}
                          style={imageFit === 'center' ? { objectFit: 'none', objectPosition: 'center' } : undefined}
                        />
                      </div>

                      {/* Right height ruler */}
                      <span className='text-xs text-gray-500' style={{ writingMode: 'vertical-rl' }}>
                        {getTotalHeight().toFixed(2)}"
                      </span>
                      <div className='flex flex-col items-center gap-1' style={{ height: `${getPreviewBoxDimensions().height}px` }}>
                        <ChevronUp size={12} className='text-gray-400' />
                        <div className='flex-1 border-l border-gray-400' />
                        <ChevronDown size={12} className='text-gray-400' />
                      </div>
                    </div>

                    {/* Bottom width ruler */}
                    <span className='text-xs text-gray-500 mt-1'>{getTotalWidth().toFixed(2)}"</span>
                    <div className='flex items-center gap-1' style={{ width: `${getPreviewBoxDimensions().width}px` }}>
                      <ChevronLeft size={12} className='text-gray-400' />
                      <div className='flex-1 border-t border-gray-400' />
                      <ChevronRight size={12} className='text-gray-400' />
                    </div>

                    <p className='text-center text-gray-600 text-sm font-medium mt-3 mb-3'>Front Side</p>

                    {/* Image fit: Center / Fit segmented toggle */}
                    <div className='inline-flex rounded-lg overflow-hidden border-2 border-green-600'>
                      <button
                        type='button'
                        onClick={() => handleImageFitChange('center')}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wide transition ${
                          imageFit === 'center' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        Center
                      </button>
                      <button
                        type='button'
                        onClick={() => handleImageFitChange('fit')}
                        className={`px-6 py-2 text-sm font-bold uppercase tracking-wide transition ${
                          imageFit === 'fit' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        Fit
                      </button>
                    </div>
                  </div>
                )}

                {/* Info / Size / Config Boxes Row */}
                <div className='relative flex flex-wrap gap-4 mt-4'>
                  {/* Images - click to open the image library and select/change the artwork */}
                  <button
                    type='button'
                    onClick={() => setShowImageUploadModal(true)}
                    className='flex-none w-[270px] flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                  >
                    <span className='text-gray-600 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm'>{imagePreview ? '1' : '0'}</span>
                  </button>

                  {/* Size - click to open the dimensions popup */}
                  <div className='relative flex-none w-[270px]'>
                    <button
                      type='button'
                      onClick={() => setOpenPopup(openPopup === 'size' ? null : 'size')}
                      className='w-full flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                    >
                      <span className='text-gray-600 font-medium text-sm tracking-wide'>SIZE</span>
                      <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm'>{getDimensionString()}</span>
                    </button>

                    {/* Sign size popup */}
                    {openPopup === 'size' && (
                      <div className='absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                        <div className='px-4 py-2 border-b border-gray-200 text-center'>
                          <span className='text-sm text-gray-700'>Sign size</span>
                        </div>
                        <div className='px-4 py-3 space-y-3'>
                          <div className='flex items-center gap-2'>
                            <label className='text-sm text-gray-600 w-14'>width:</label>
                            <input
                              type='number'
                              min='0'
                              value={widthFt}
                              onChange={(e) => setWidthFt(e.target.value)}
                              className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>ft</span>
                            <input
                              type='number'
                              min='0'
                              max='11'
                              value={widthIn}
                              onChange={(e) => setWidthIn(e.target.value)}
                              className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>in</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <label className='text-sm text-gray-600 w-14'>height:</label>
                            <input
                              type='number'
                              min='0'
                              value={heightFt}
                              onChange={(e) => setHeightFt(e.target.value)}
                              className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>ft</span>
                            <input
                              type='number'
                              min='0'
                              max='11'
                              value={heightIn}
                              onChange={(e) => setHeightIn(e.target.value)}
                              className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                            <span className='text-xs text-gray-500'>in</span>
                          </div>
                        </div>
                      </div>
                    )}
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
                          className='flex-none w-[270px] flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50'
                        >
                          <span className='text-gray-400 font-medium text-sm tracking-wide'>{label}</span>
                          <button
                            type='button'
                            onClick={() => setSelectedConfig({ ...selectedConfig, [key]: !currentValue })}
                            aria-label={`Toggle ${label}`}
                            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                              currentValue ? 'bg-gray-700' : 'bg-gray-300'
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
                      <div key={key} className='relative flex-none w-[270px]'>
                        <button
                          type='button'
                          onClick={() => setOpenPopup(openPopup === key ? null : key)}
                          className='w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 hover:bg-gray-100 transition'
                        >
                          <span className='text-gray-400 font-medium text-sm tracking-wide'>{label}</span>
                          <span className='px-3 py-1 bg-gray-200 text-gray-500 rounded font-bold text-sm uppercase truncate max-w-[8rem]'>
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

export default OrderAdhesive