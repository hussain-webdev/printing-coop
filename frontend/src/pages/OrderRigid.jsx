import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
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

const OrderRigid = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Dimensions state
  const [widthFt, setWidthFt] = useState(0)
  const [widthIn, setWidthIn] = useState(0)
  const [heightFt, setHeightFt] = useState(0)
  const [heightIn, setHeightIn] = useState(0)
  
  // Finish config state
  const [selectedConfig, setSelectedConfig] = useState({})
  
  // Quantity state
  const [quantity, setQuantity] = useState(1)

  // Which popup is currently open: null | 'size' | 'quantity' | <finishConfig key>
  const [openPopup, setOpenPopup] = useState(null)
  
  // Loading add to cart
  const [addingToCart, setAddingToCart] = useState(false)
  
  // Sheet navigation
  const [currentSheet, setCurrentSheet] = useState(1)

  // Uploaded images: up to 10 cells total across all images. Each entry is
  // { url, quantity } - quantity is how many of the 10 cells that image fills.
  // Only the most recently added image's quantity is editable; earlier ones
  // are locked in place once a new image is added.
  const MAX_CELLS = 10
  const [images, setImages] = useState([])
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)

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
          const initialConfig = {}
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

  const getTotalWidth = () => parseFloat(widthFt) + parseFloat(widthIn) / 12
  const getTotalHeight = () => parseFloat(heightFt) + parseFloat(heightIn) / 12

  // Formats a number of inches for display - whole numbers show with no decimals,
  // fractional ones (e.g. from a non-whole inch entry) keep up to 2 decimal places.
  const formatInches = (value) => {
    const rounded = Math.round((value || 0) * 100) / 100
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2)
  }

  const getDimensionString = () => {
    const totalWidthInches = (parseFloat(widthFt) || 0) * 12 + (parseFloat(widthIn) || 0)
    const totalHeightInches = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)
    return `${formatInches(totalWidthInches)}" x ${formatInches(totalHeightInches)}"`
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

  // Total cells currently filled across all selected images
  const getTotalUsedCells = () => images.reduce((sum, img) => sum + img.quantity, 0)

  // When editingIndex is set, the next image picked replaces that entry's image
  // instead of adding a new one. null means "add a new image".
  const [editingIndex, setEditingIndex] = useState(null)

  // Opens the picker to add a new image, as long as there's room left in the grid
  const handleOpenImagePicker = () => {
    if (getTotalUsedCells() >= MAX_CELLS) {
      toast.error('All 10 cells are already filled')
      return
    }
    setEditingIndex(null)
    setShowImageUploadModal(true)
  }

  // Opens the picker to replace a specific, already-selected image (its quantity is kept)
  const handleChangeImage = (index) => {
    setEditingIndex(index)
    setShowImageUploadModal(true)
  }

  // Removes an image entry entirely, freeing its cells back up for the others
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleImageSelect = (imageUrl) => {
    if (editingIndex !== null) {
      // Replacing an existing entry's image - quantity stays the same
      setImages((prev) => prev.map((img, idx) => (idx === editingIndex ? { ...img, url: imageUrl } : img)))
      setEditingIndex(null)
      return
    }

    // Adding a brand new entry, starting at quantity 1
    setImages((prev) => {
      const remaining = MAX_CELLS - prev.reduce((sum, img) => sum + img.quantity, 0)
      if (remaining <= 0) {
        toast.error('All 10 cells are already filled')
        return prev
      }
      return [...prev, { url: imageUrl, quantity: 1 }]
    })
  }

  // Any image's quantity can be changed independently, capped by however many
  // cells all the OTHER images are currently using
  const handleImageQuantityChange = (index, newQuantity) => {
    setImages((prev) => {
      const usedByOthers = prev.reduce((sum, img, idx) => (idx === index ? sum : sum + img.quantity), 0)
      const maxAllowed = MAX_CELLS - usedByOthers
      const clamped = Math.min(Math.max(1, newQuantity), maxAllowed)
      return prev.map((img, idx) => (idx === index ? { ...img, quantity: clamped } : img))
    })
  }

  // Expands the images array into one URL per cell (in order), capped at 10 entries -
  // this is exactly what gets sent to the cart as the item's images array
  const getCellImages = () => {
    const cells = []
    images.forEach((img) => {
      for (let i = 0; i < img.quantity; i++) {
        if (cells.length < MAX_CELLS) cells.push(img.url)
      }
    })
    return cells
  }

  // Extracts a display name from an image URL, for the "image name -> quantity" config entries
  const getImageName = (url, index) => {
    try {
      const withoutQuery = url.split('?')[0]
      const segments = withoutQuery.split('/')
      const fileName = decodeURIComponent(segments[segments.length - 1] || '')
      return fileName || `Image ${index + 1}`
    } catch (e) {
      return `Image ${index + 1}`
    }
  }


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

      const imageConfigEntries = images.reduce((acc, img, idx) => {
        acc[getImageName(img.url, idx)] = img.quantity
        return acc
      }, {})

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
          width: getTotalWidth(),
          height: getTotalHeight(),
          size: [widthFt ? `${widthFt}ft` : '', widthIn ? `${widthIn}in` : '', heightFt ? `${heightFt}ft` : '', heightIn ? `${heightIn}in` : ''].filter(Boolean),
          selectedFinishConfig: { ...selectedConfig, ...imageConfigEntries },
          basePrice: getAdjustedBasePrice(),
          images: getCellImages(),
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
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900 mb-1'>{getLocalizedField(product.name, language, 'Product')}</h1>
                  <p className='text-gray-600 text-sm'>{getLocalizedField(product.name, language, 'Product')} Rigid, {getDimensionString()}</p>
                </div>

                <div className='flex items-center gap-4'>
                  {/* Price */}
                  <div className='text-right'>
                    <p className='text-3xl font-bold text-green-500 leading-tight'>${getAdjustedBasePrice().toFixed(2)}</p>
                    <p className='text-gray-500 text-xs'>0 sqft / 24 Hours Production</p>
                  </div>

                  {/* Add to Cart - sits beside the price */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className='flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition disabled:opacity-50 whitespace-nowrap'
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                    {!addingToCart && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-4xl mx-auto'>
                {/* Sheet Grid Visualization */}
                <div className='relative flex flex-col items-center py-8'>
                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSheet(Math.max(1, currentSheet - 1))}
                    className='absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition'
                  >
                    <ChevronLeft size={24} className='text-blue-600' />
                  </button>

                  <button
                    onClick={() => setCurrentSheet(currentSheet + 1)}
                    className='absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition'
                  >
                    <ChevronRight size={24} className='text-blue-600' />
                  </button>

                  {/* Top Labels */}
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-sm font-bold text-gray-900'>10 signs</span>
                    <ChevronDown size={12} className='text-gray-700 -ml-1' />
                    <span className='text-sm font-bold text-gray-900 ml-2'>TOP OF SHEET</span>
                    <ChevronDown size={12} className='text-gray-700 -ml-1' />
                  </div>

                  <div className='relative flex items-center'>
                    {/* Side Label - LEFT */}
                    <div className='flex flex-col items-center gap-1 mr-3' style={{ writingMode: 'vertical-rl' }}>
                      <span className='text-xs font-semibold text-gray-700 tracking-wide' style={{ transform: 'rotate(180deg)' }}>LEFT</span>
                    </div>

                    {/* Sheet with header strip + 2x5 dashed grid */}
                    <div>
                      <div className='border border-gray-800 bg-white' style={{ width: '200px', height: '28px' }} />
                      <div
                        className='grid'
                        style={{ width: '200px', height: '450px', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}
                      >
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const cellImage = getCellImages()[idx]
                          return (
                            <div
                              key={idx}
                              className={`border-2 bg-white overflow-hidden ${
                                cellImage ? 'border-solid border-gray-800' : 'border-dashed border-blue-600'
                              }`}
                            >
                              {cellImage && (
                                <img src={cellImage} alt={`Sign ${idx + 1}`} className='w-full h-full object-cover' />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Side Label - RIGHT */}
                    <div className='flex flex-col items-center gap-1 ml-3' style={{ writingMode: 'vertical-rl' }}>
                      <span className='text-xs font-semibold text-gray-700 tracking-wide'>RIGHT</span>
                    </div>
                  </div>

                  {/* Bottom Labels */}
                  <div className='text-center mt-4'>
                    <p className='text-sm text-gray-900'>Sheet #{currentSheet} / 48" x 96" / Front Side</p>
                  </div>
                </div>

                {/* Info / Size / Config Boxes Row - full width, wraps across the screen */}
                <div className='relative justify-center flex flex-wrap gap-3 mt-5'>
                  {/* Images - click to open the image library and add another image */}
                  <button
                    type='button'
                    onClick={handleOpenImagePicker}
                    className='flex-none w-[220px] flex items-center justify-between border-2 border-gray-400 px-4 py-3 bg-white hover:bg-gray-50 transition'
                  >
                    <span className='text-gray-600 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-700 text-white font-bold text-sm'>{getTotalUsedCells()}/{MAX_CELLS}</span>
                  </button>

                  {/* One card per selected image - each has its own change-image button
                      and its own independent quantity stepper */}
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className='flex-none w-[220px] flex items-center gap-2 border-2 border-gray-400 px-3 py-2.5 bg-white'
                    >
                      <img
                        src={img.url}
                        alt={`Selected ${idx + 1}`}
                        className='w-9 h-9 object-cover border border-gray-300 shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => handleChangeImage(idx)}
                            className='text-xs text-blue-600 hover:underline truncate'
                          >
                            Change image
                          </button>
                          <button
                            type='button'
                            onClick={() => handleRemoveImage(idx)}
                            className='text-xs text-red-600 hover:underline shrink-0'
                          >
                            Remove
                          </button>
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                          <button
                            type='button'
                            onClick={() => handleImageQuantityChange(idx, img.quantity - 1)}
                            className='p-1 hover:bg-gray-100 transition'
                            aria-label={`Decrease quantity for image ${idx + 1}`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className='px-2 py-0.5 bg-gray-700 text-white font-bold text-xs min-w-[1.75rem] text-center'>
                            {img.quantity}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleImageQuantityChange(idx, img.quantity + 1)}
                            className='p-1 hover:bg-gray-100 transition'
                            aria-label={`Increase quantity for image ${idx + 1}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Size - click to open the dimensions popup */}
                  <div className='relative flex-none w-[220px]'>
                    <button
                      type='button'
                      onClick={() => setOpenPopup(openPopup === 'size' ? null : 'size')}
                      className='w-full flex items-center justify-between border-2 border-gray-400 px-4 py-3 bg-white hover:bg-gray-50 transition'
                    >
                      <span className='text-gray-600 font-medium text-sm tracking-wide'>SIZE</span>
                      <span className='px-3 py-1 bg-gray-700 text-white font-bold text-sm'>{getDimensionString()}</span>
                    </button>

                    {/* Sign size popup */}
                    {openPopup === 'size' && (
                      <div className='absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-300 shadow-lg z-10'>
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

                  {/* Quantity - click to open the stepper popup */}
                  <div className='relative flex-none w-[220px]'>
                    <button
                      type='button'
                      onClick={() => setOpenPopup(openPopup === 'quantity' ? null : 'quantity')}
                      className='w-full flex items-center justify-between border-2 border-gray-400 px-4 py-3 bg-white hover:bg-gray-50 transition'
                    >
                      <span className='text-gray-600 font-medium text-sm tracking-wide'>QUANTITY</span>
                      <span className='px-3 py-1 bg-gray-700 text-white font-bold text-sm'>{quantity}</span>
                    </button>

                    {/* Quantity popup */}
                    {openPopup === 'quantity' && (
                      <div className='absolute bottom-full left-0 mb-2 w-56 bg-white border-2 border-gray-300 shadow-lg z-10'>
                        <div className='px-4 py-2 border-b border-gray-200 text-center'>
                          <span className='text-sm text-gray-700'>Quantity</span>
                        </div>
                        <div className='px-4 py-3 flex justify-center'>
                          <div className='flex items-center gap-2 border border-gray-300 rounded-lg'>
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className='p-2 hover:bg-gray-100 transition'
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type='number'
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className='w-14 px-2 py-2 text-center border-none focus:outline-none'
                            />
                            <button
                              onClick={() => setQuantity(quantity + 1)}
                              className='p-2 hover:bg-gray-100 transition'
                            >
                              <Plus size={16} />
                            </button>
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
                          className='flex-none w-[220px] flex items-center justify-between border-2 border-gray-200 px-4 py-3 bg-gray-50'
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
                      <div key={key} className='relative flex-none w-[220px]'>
                        <button
                          type='button'
                          onClick={() => setOpenPopup(openPopup === key ? null : key)}
                          className='w-full flex items-center justify-between border-2 border-gray-200 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition'
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderRigid