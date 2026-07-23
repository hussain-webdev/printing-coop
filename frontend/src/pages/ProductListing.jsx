import React, { useState, useEffect, useMemo } from 'react'
import { Loader, Search, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const ProductListing = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchName, setSearchName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('none') // 'none' | 'asc' | 'desc'

  // Which filter dropdown is open: null | 'category' | 'sort'
  const [openFilterMenu, setOpenFilterMenu] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/product/all`)
        const data = await response.json()

        if (data.success) {
          setProducts(data.products)
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

  // Unique category list derived from fetched products
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(unique)
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    if (searchName.trim()) {
      const query = searchName.trim().toLowerCase()
      result = result.filter((p) => p.name?.toLowerCase().includes(query))
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.basePrice - b.basePrice)
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.basePrice - a.basePrice)
    }

    return result
  }, [products, selectedCategory, searchName, sortOrder])

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='p-4'>
          <h1 className='pb-4 font-light text-2xl'>{t('productListing.title')}</h1>

          {/* Filter toolbar */}
          <div className='flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-gray-200'>
            {/* Search by name */}
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search size={16} className='absolute left-3 top-2.5 text-gray-400' />
              <input
                type='text'
                placeholder={t('productListing.searchPlaceholder')}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
            </div>

            {/* Category filter */}
            <div className='relative'>
              <button
                onClick={() => setOpenFilterMenu(openFilterMenu === 'category' ? null : 'category')}
                className='flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
              >
                {t('productListing.category')}
                <ChevronDown size={14} />
              </button>
              {openFilterMenu === 'category' && (
                <div className='absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2'>
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm capitalize transition ${
                      selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('productListing.allCategories')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat)
                        setOpenFilterMenu(null)
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm capitalize transition ${
                        selectedCategory === cat ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort by price */}
            <div className='relative'>
              <button
                onClick={() => setOpenFilterMenu(openFilterMenu === 'sort' ? null : 'sort')}
                className='flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
              >
                {t('productListing.sortByPrice')}
                <ChevronDown size={14} />
              </button>
              {openFilterMenu === 'sort' && (
                <div className='absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2'>
                  <button
                    onClick={() => {
                      setSortOrder('none')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      sortOrder === 'none' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('productListing.default')}
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder('asc')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      sortOrder === 'asc' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('productListing.lowToHigh')}
                  </button>
                  <button
                    onClick={() => {
                      setSortOrder('desc')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      sortOrder === 'desc' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t('productListing.highToLow')}
                  </button>
                </div>
              )}
            </div>

            {/* Reset */}
            {(selectedCategory !== 'all' || searchName || sortOrder !== 'none') && (
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchName('')
                  setSortOrder('none')
                  setOpenFilterMenu(null)
                }}
                className='px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition'
              >
                {t('productListing.reset')}
              </button>
            )}
          </div>

          {loading ? (
            <div className='flex justify-center items-center py-16'>
              <Loader size={32} className='animate-spin text-gray-600' />
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <p className='text-red-700'>{error}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
              <p className='text-gray-700'>{t('productListing.noMatches')}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ProductListing
