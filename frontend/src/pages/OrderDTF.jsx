import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, Plus, Minus, ChevronRight, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardNavbar from '../components/DashboardNavbar'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const OrderDTF = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
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
          width: undefined,
          height: undefined,
          size: [],
          selectedFinishConfig: {},
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
                  <p className='text-gray-600'>DTF Transfer 22", 0" x 0"</p>
                </div>
                <div className='text-right'>
                  <p className='text-5xl font-bold text-green-500'>${product.basePrice.toFixed(2)}</p>
                  <p className='text-gray-600 text-sm'>0 linear inch / 24 Hours Production</p>
                </div>
              </div>

              {/* Main Content - single centered column */}
              <div className='max-w-6xl mx-auto'>
                {/* Sheet Line Visualization (click anywhere to select the transfer image) */}
                <div className='relative py-6'>
                  {/* Hidden file input covering the whole sheet area */}
                  {/* <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                  /> */}

                  {/* Top row: signs count / TOP OF SHEET / LEFT-RIGHT edge labels */}
                  <div className='relative flex items-center justify-between px-6'>
                    <span className='text-sm font-bold text-gray-900'>0 signs</span>
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
                    <p className='text-sm text-gray-900'>Sheet #1 / 22" x 0" / Front Side</p>
                  </div>

                  {/* Preview / blank canvas area */}
                  <div className='relative h-96 mt-6 flex items-center justify-center'>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt='Preview'
                        className='max-h-full max-w-full object-contain'
                      />
                    )}
                  </div>
                </div>

                {/* Images Box (only box for this product type) */}
                <div className='flex justify-center'>
                  <div className='w-64 flex items-center justify-between border border-gray-400 rounded-lg px-4 py-3 bg-white'>
                    <span className='text-gray-400 font-medium text-sm tracking-wide'>IMAGES</span>
                    <span className='px-3 py-1 bg-gray-500 text-white rounded font-bold text-sm'>{uploadedImage ? '1' : '0'}</span>
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