import React, { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const CATEGORY = 'adhesive'

const DashboardAdhesive = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/product/all`)
        const data = await response.json()

        if (data.success) {
          const filteredProducts = data.products.filter(
            (product) => product.category.toLowerCase() === CATEGORY.toLowerCase()
          )
          setProducts(filteredProducts)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch products')
          toast.error('Failed to fetch products')
        }
      } catch (err) {
        console.error('[v0] Error fetching products:', err)
        setError('Connection error. Please check your backend server.')
        toast.error('Connection error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <img src="/adhesiveheroimg.png" alt="Adhesive Products Hero" />
        <div className='p-4'>
          <h1 className='pb-4 font-light text-2xl'>Adhesive Products</h1>
          
          {loading ? (
            <div className='flex justify-center items-center py-16'>
              <Loader size={32} className='animate-spin text-gray-600' />
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <p className='text-red-700'>{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
              <p className='text-gray-700'>No adhesive products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardAdhesive
