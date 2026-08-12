import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import Draggable from 'react-draggable'
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

const OrderApparel = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Size and Color selection state
  const [selectedSizes, setSelectedSizes] = useState([])
  const [availableSizes, setAvailableSizes] = useState([])
  
  const [selectedColor, setSelectedColor] = useState('')
  const [availableColors, setAvailableColors] = useState([])
  
  // Quantity state
  const [quantity, setQuantity] = useState(1)

  // Which popup is currently open: null | 'sizes' | 'color'
  const [openPopup, setOpenPopup] = useState(null)

  // Loading add to cart
  const [addingToCart, setAddingToCart] = useState(false)

  // Uploaded front image state
  const [imagePreview, setImagePreview] = useState(null)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)

  // Draggable position of the image inside the fixed upload box
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)

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
          
          // Extract sizes and colors from finishConfig
          let finishConfig = data.product.finishConfig
          
          // Parse finishConfig if it's a string
          if (typeof finishConfig === 'string') {
            try {
              finishConfig = JSON.parse(finishConfig)
            } catch (e) {
              console.error('[v0] Error parsing finishConfig:', e)
            }
          }
          
          console.log('[v0] finishConfig:', finishConfig)
          
          if (finishConfig && typeof finishConfig === 'object') {
            const { sizes = [], colors = [] } = finishConfig
            
            console.log('[v0] sizes:', sizes)
            console.log('[v0] colors:', colors)
            
            // Set available sizes and colors
            if (Array.isArray(sizes) && sizes.length > 0) {
              setAvailableSizes(sizes)
            }
            
            if (Array.isArray(colors) && colors.length > 0) {
              setAvailableColors(colors)
              // Set default color to first available
              setSelectedColor(colors[0])
            }
          }
          
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

  // Toggle size selection
  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    )
  }

  const handleImageSelect = (imageUrl) => {
    setImagePreview(imageUrl)
    setImagePosition({ x: 0, y: 0 })
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

      if (selectedSizes.length === 0) {
        toast.error('Please select at least one size')
        return
      }

      if (!selectedColor) {
        toast.error('Please select a color')
        return
      }

      setAddingToCart(true)

      const requestBody = {
        wholesaleSellerId: parseInt(sellerId),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        width: undefined,
        height: undefined,
        size: selectedSizes,
        selectedFinishConfig: {
          color: selectedColor,
        },
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
                  <p className='text-gray-600'>{getLocalizedField(product.name, language, 'Product')} Apparel</p>
                </div>
                <div className='text-right'>
                  <p className='text-5xl font-bold text-green-500'>${product.basePrice.toFixed(2)}</p>
                  <p className='text-gray-600 text-sm'>Custom Design</p>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-4xl mx-auto'>
                {/* T-Shirt Image with Upload Overlay */}
                <div className='relative bg-white rounded-lg p-8 flex flex-col items-center'>
                  {/* Tabs */}
                  <div className='flex justify-center gap-3 mb-4'>
                    <button className='px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-medium shadow-sm'>
                      Front
                    </button>
                    <button className='px-6 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium'>
                      Back
                    </button>
                  </div>

                  {/* T-Shirt Image */}
                  <div className='relative h-96 flex items-center justify-center'>
                    <img
                      src='/shirt_front_white.png'
                      alt='T-Shirt'
                      className='h-full object-contain'
                    />

                    {/* Upload Box Overlay */}
                    <div className='absolute inset-0 flex items-center justify-center'>
                      {!imagePreview ? (
                        <div
                          onClick={() => setShowImageUploadModal(true)}
                          className='border-2 border-dashed border-gray-400 rounded-lg bg-gray-100/80 cursor-pointer hover:bg-gray-200/80 transition flex flex-col items-center justify-center gap-2 w-36 h-36'
                        >
                          <span className='w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center mb-1'>
                            <Plus size={12} className='text-gray-500' />
                          </span>
                          <p className='text-center text-gray-500 font-bold text-sm tracking-wide'>CLICK HERE</p>
                          <p className='text-center text-gray-500 font-bold text-sm tracking-wide'>TO SELECT</p>
                          <p className='text-center text-gray-500 font-bold text-sm tracking-wide'>FRONT IMAGE</p>
                        </div>
                      ) : (
                        <div className='relative border-2 border-dashed border-gray-400 rounded-lg bg-white/40 overflow-hidden w-36 h-36'>
                          <Draggable
                            nodeRef={imageRef}
                            bounds='parent'
                            position={imagePosition}
                            onDrag={(e, data) => setImagePosition({ x: data.x, y: data.y })}
                            onStop={(e, data) => setImagePosition({ x: data.x, y: data.y })}
                          >
                            <img
                              ref={imageRef}
                              src={imagePreview}
                              alt='Front design'
                              draggable={false}
                              className='absolute top-0 left-0 max-w-full max-h-full cursor-move select-none'
                            />
                          </Draggable>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Caption */}
                  <p className='text-sm text-gray-500 mt-2'>
                    Preview based on {selectedSizes[0] || availableSizes[0] || 'Large'} size T-Shirt
                  </p>
                </div>

                {/* Sizes / Color / Images Boxes Row */}
                <div className='relative flex gap-4 mt-4'>
                  {/* Images - click to open the image library and select/change the artwork */}
                  <button
                    type='button'
                    onClick={() => setShowImageUploadModal(true)}
                    className='flex-1 flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                  >
                    <span className='text-gray-600 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm'>{imagePreview ? '1' : '0'}</span>
                  </button>

                  {/* Sizes - click to open the size selection popup */}
                  <div className='relative flex-1'>
                    <button
                      type='button'
                      onClick={() => setOpenPopup(openPopup === 'sizes' ? null : 'sizes')}
                      className='w-full flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                    >
                      <span className='text-gray-600 font-medium text-sm tracking-wide'>SIZES</span>
                      <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm truncate max-w-[10rem]'>
                        {selectedSizes.length > 0 ? selectedSizes.join(', ') : 'Select'}
                      </span>
                    </button>

                    {/* Size selection popup */}
                    {openPopup === 'sizes' && (
                      <div className='absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                        <div className='px-4 py-2 border-b border-gray-200 text-center'>
                          <span className='text-sm text-gray-700'>Select Sizes</span>
                        </div>
                        <div className='p-3 space-y-2'>
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => toggleSize(size)}
                              className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                                selectedSizes.includes(size)
                                  ? 'bg-yellow-400 text-gray-900'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Color - click to open the color selection popup */}
                  {availableColors.length > 0 && (
                    <div className='relative flex-1'>
                      <button
                        type='button'
                        onClick={() => setOpenPopup(openPopup === 'color' ? null : 'color')}
                        className='w-full flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition'
                      >
                        <span className='text-gray-600 font-medium text-sm tracking-wide'>COLOR</span>
                        <span className='px-3 py-1 bg-gray-700 text-white rounded font-bold text-sm truncate max-w-[10rem]'>
                          {selectedColor || 'Select'}
                        </span>
                      </button>

                      {/* Color selection popup */}
                      {openPopup === 'color' && (
                        <div className='absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10'>
                          <div className='px-4 py-2 border-b border-gray-200 text-center'>
                            <span className='text-sm text-gray-700'>Select Color</span>
                          </div>
                          <div className='p-3'>
                            <select
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            >
                              <option value=''>Select a color</option>
                              {availableColors.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

export default OrderApparel