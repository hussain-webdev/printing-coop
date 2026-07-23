import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader, Search, ChevronDown, RotateCcw, Download, FileText, Star, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const OrderHistory = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const receiptRef = useRef()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [reorderingOrderId, setReorderingOrderId] = useState(null)
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null)

  // Filter states
  const [searchOrderId, setSearchOrderId] = useState('')
  const [searchProductName, setSearchProductName] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // UI-only state for the compact filter toolbar (which dropdown is open)
  const [openFilterMenu, setOpenFilterMenu] = useState(null) // 'order' | 'product' | 'price' | null
  // UI-only, not persisted anywhere - purely visual favorite star toggle
  const [favoriteOrderIds, setFavoriteOrderIds] = useState(new Set())

  const toggleFavorite = (orderId) => {
    setFavoriteOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('sellerToken')
        const sellerId = localStorage.getItem('sellerId')

        if (!token || !sellerId) {
          setError(t('nav.orderHistory'))
          setLoading(false)
          return
        }

        const response = await fetch(`${BACKEND_URL}/api/order/seller-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ wholesaleSellerId: parseInt(sellerId) }),
        })

        const data = await response.json()

        if (data.success) {
          setOrders(data.orders)
          setError(null)
        } else {
          setError(data.message || t('orderHistory.title'))
          toast.error(t('orderHistory.title'))
        }
      } catch (err) {
        console.error('[v0] Error fetching orders:', err)
        setError(t('common.connectionError'))
        toast.error(t('common.connectionError'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Filtered orders based on search criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search by order ID
      if (searchOrderId && !order.orderNumber.toLowerCase().includes(searchOrderId.toLowerCase())) {
        return false
      }

      // Search by product name
      if (searchProductName) {
        const hasMatchingProduct = order.orderItems.some((item) =>
          item.product.name.toLowerCase().includes(searchProductName.toLowerCase())
        )
        if (!hasMatchingProduct) return false
      }

      // Filter by price range
      if (minPrice && order.total < parseFloat(minPrice)) {
        return false
      }
      if (maxPrice && order.total > parseFloat(maxPrice)) {
        return false
      }

      // Filter by order status
      if (selectedOrderStatus !== 'all' && order.orderStatus !== selectedOrderStatus) {
        return false
      }

      // Filter by payment status
      if (selectedPaymentStatus !== 'all' && order.paymentStatus !== selectedPaymentStatus) {
        return false
      }

      // Filter by date range
      if (fromDate || toDate) {
        const orderDate = new Date(order.createdAt)
        if (fromDate) {
          const from = new Date(fromDate)
          from.setHours(0, 0, 0, 0)
          if (orderDate < from) return false
        }
        if (toDate) {
          const to = new Date(toDate)
          to.setHours(23, 59, 59, 999)
          if (orderDate > to) return false
        }
      }

      return true
    })
  }, [orders, searchOrderId, searchProductName, minPrice, maxPrice, selectedOrderStatus, selectedPaymentStatus, fromDate, toDate])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Shipped':
        return 'bg-blue-100 text-blue-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const formatCompactDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    return `${month} ${date.getDate()} ${date.getFullYear()}`
  }

  const handleReorder = async (order) => {
    try {
      const token = localStorage.getItem('sellerToken')
      const sellerId = localStorage.getItem('sellerId')

      if (!token || !sellerId) {
        toast.error(t('cart.pleaseLogin'))
        return
      }

      setReorderingOrderId(order.id)

      const response = await fetch(`${BACKEND_URL}/api/order/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          wholesaleSellerId: parseInt(sellerId),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Successfully added ${data.totalItemsAdded} item(s) to cart`)
        // Redirect to cart page
        navigate('/cart')
      } else {
        toast.error(data.message || 'Failed to reorder')
      }
    } catch (err) {
      console.error('[v0] Error reordering:', err)
      toast.error('Error placing reorder. Please try again.')
    } finally {
      setReorderingOrderId(null)
    }
  }

  const downloadCSV = () => {
    try {
      // Create CSV headers
      const headers = ['Order Number', 'Order Date', 'Phone Number', 'Street', 'City', 'State', 'Zip Code', 'Country', 'Subtotal', 'Shipping Cost', 'Total', 'Order Status', 'Payment Status', 'Payment Method']
      
      // Create CSV rows
      const rows = orders.map((order) => [
        order.orderNumber || '',
        new Date(order.createdAt).toLocaleDateString('en-US') || '',
        order.shippingAddress?.phoneNumber || '',
        order.shippingAddress?.street || '',
        order.shippingAddress?.city || '',
        order.shippingAddress?.state || '',
        order.shippingAddress?.zipcode || '',
        order.shippingAddress?.country || '',
        order.subtotal?.toFixed(2) || '',
        order.shippingCost?.toFixed(2) || '',
        order.total?.toFixed(2) || '',
        order.orderStatus || '',
        order.paymentStatus || '',
        order.paymentMethod || '',
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV exported successfully')
    } catch (err) {
      console.error('[v0] Error downloading CSV:', err)
      toast.error('Error downloading CSV')
    }
  }

  const downloadReceipt = async (order) => {
    try {
      setDownloadingReceiptId(order.id)
      
      // Create receipt HTML
      const receiptHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 800px;">
          <h1 style="text-align: center; margin-bottom: 30px;">${t('orderHistory.viewReceipt')}</h1>
          
          <div style="margin-bottom: 20px;">
            <h3>Order Information</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US')}</p>
            <p><strong>Order Status:</strong> ${order.orderStatus}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress?.street || ''}</p>
            <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipcode || ''}</p>
            <p>${order.shippingAddress?.country || ''}</p>
            <p>${order.shippingAddress?.phoneNumber || ''}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3>Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                  <th style="text-align: left; padding: 8px;">Product</th>
                  <th style="text-align: center; padding: 8px;">Quantity</th>
                  <th style="text-align: right; padding: 8px;">Price</th>
                  <th style="text-align: right; padding: 8px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.orderItems.map((item) => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${item.product?.name || ''}</td>
                    <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 8px;">$${(item.totalPrice / item.quantity).toFixed(2)}</td>
                    <td style="text-align: right; padding: 8px;">$${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px; border-top: 2px solid #ddd; padding-top: 20px;">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
              <div style="width: 200px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <strong>Subtotal:</strong>
                  <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <strong>Shipping:</strong>
                  <span>$${order.shippingCost.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; border-top: 1px solid #ddd; padding-top: 5px;">
                  <strong>Total:</strong>
                  <span>$${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      // Create temporary element
      const element = document.createElement('div')
      element.innerHTML = receiptHTML
      document.body.appendChild(element)

      // Convert to canvas and then PDF
      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 20
      }

      pdf.save(`receipt-${order.orderNumber}.pdf`)
      toast.success(t('orderHistory.viewReceipt'))
      
      // Clean up
      document.body.removeChild(element)
    } catch (err) {
      console.error('[v0] Error downloading receipt:', err)
      toast.error('Error downloading receipt')
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          {/* Header */}
          <div className='mb-6 flex justify-between items-center'>
            <h1 className='text-4xl font-bold text-gray-900'>{t('orderHistory.title')}</h1>
            {orders.length > 0 && (
              <button
                onClick={downloadCSV}
                className='px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
              >
                {t('orderHistory.csvDownload')}
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
          ) : (
            <>
              {/* Filter toolbar */}
              <div className='mb-6'>
                <button
                  onClick={() => setOpenFilterMenu(openFilterMenu ? null : 'order')}
                  className='mb-2 text-gray-500 hover:text-gray-700'
                  aria-label='Toggle filters'
                >
                  <Filter size={16} />
                </button>

                <div className='flex flex-wrap items-center gap-2 pb-3 border-b border-gray-200'>
                  {/* Order (Order ID + Order Status + Payment Status) */}
                  <div className='relative'>
                    <button
                      onClick={() => setOpenFilterMenu(openFilterMenu === 'order' ? null : 'order')}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
                    >
                      {t('orderHistory.orderId')}
                      <ChevronDown size={14} />
                    </button>
                    {openFilterMenu === 'order' && (
                      <div className='absolute z-10 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3'>
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>{t('orderHistory.orderId')}</label>
                          <div className='relative'>
                            <Search size={14} className='absolute left-2.5 top-2.5 text-gray-400' />
                            <input
                              type='text'
                              placeholder='Search order ID...'
                              value={searchOrderId}
                              onChange={(e) => setSearchOrderId(e.target.value)}
                              className='w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            />
                          </div>
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>{t('orderHistory.title')}</label>
                          <select
                            value={selectedOrderStatus}
                            onChange={(e) => setSelectedOrderStatus(e.target.value)}
                            className='w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          >
                            <option value='all'>All Statuses</option>
                            <option value='Pending'>Pending</option>
                            <option value='Shipped'>{t('orderHistory.shipped')}</option>
                            <option value='Completed'>Completed</option>
                            <option value='Cancelled'>Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>{t('placeOrder.paymentMethod')}</label>
                          <select
                            value={selectedPaymentStatus}
                            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                            className='w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          >
                            <option value='all'>All Statuses</option>
                            <option value='Pending'>Pending</option>
                            <option value='Paid'>Paid</option>
                            <option value='Failed'>Failed</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image - column label, no filter behind it yet */}
                  <button
                    className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 cursor-default'
                  >
                    {t('orderHistory.viewReceipt')}
                    <ChevronDown size={14} />
                  </button>

                  {/* Product */}
                  <div className='relative'>
                    <button
                      onClick={() => setOpenFilterMenu(openFilterMenu === 'product' ? null : 'product')}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
                    >
                      {t('placeOrder.orderReview')}
                      <ChevronDown size={14} />
                    </button>
                    {openFilterMenu === 'product' && (
                      <div className='absolute z-10 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4'>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Product Name</label>
                        <div className='relative'>
                          <Search size={14} className='absolute left-2.5 top-2.5 text-gray-400' />
                          <input
                            type='text'
                            placeholder='Search product name...'
                            value={searchProductName}
                            onChange={(e) => setSearchProductName(e.target.value)}
                            className='w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className='relative'>
                    <button
                      onClick={() => setOpenFilterMenu(openFilterMenu === 'price' ? null : 'price')}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
                    >
                      Price
                      <ChevronDown size={14} />
                    </button>
                    {openFilterMenu === 'price' && (
                      <div className='absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4'>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>Price Range</label>
                        <div className='flex gap-2'>
                          <input
                            type='number'
                            placeholder='Min'
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className='w-1/2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          />
                          <input
                            type='number'
                            placeholder='Max'
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className='w-1/2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className='relative'>
                    <button
                      onClick={() => setOpenFilterMenu(openFilterMenu === 'date' ? null : 'date')}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
                    >
                      Date
                      <ChevronDown size={14} />
                    </button>
                    {openFilterMenu === 'date' && (
                      <div className='absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3'>
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>From</label>
                          <input
                            type='date'
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          />
                        </div>
                        <div>
                          <label className='block text-xs font-medium text-gray-700 mb-1'>To</label>
                          <input
                            type='date'
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search - closes any open dropdown (filtering itself is already live) */}
                  <button
                    onClick={() => setOpenFilterMenu(null)}
                    className='px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition'
                  >
                    Search
                  </button>

                  {/* Reset */}
                  <button
                    onClick={() => {
                      setSearchOrderId('')
                      setSearchProductName('')
                      setMinPrice('')
                      setMaxPrice('')
                      setSelectedOrderStatus('all')
                      setSelectedPaymentStatus('all')
                      setFromDate('')
                      setToDate('')
                      setOpenFilterMenu(null)
                    }}
                    className='px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded transition'
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length > 0 ? (
                <div className='bg-white rounded-lg shadow divide-y divide-gray-200 overflow-hidden'>
                  {filteredOrders.map((order) => {
                    const thumbnails = order.orderItems
                      .map((item) => item.product?.images?.[0]?.url)
                      .filter(Boolean)
                    const visibleThumbnails = thumbnails.slice(0, 4)
                    const extraThumbnailCount = thumbnails.length - visibleThumbnails.length

                    return (
                      <div key={order.id}>
                        {/* Order Row */}
                        <div className='px-6 py-4 flex items-center gap-6 hover:bg-gray-50 transition'>
                          {/* Order number */}
                          <div className='w-32 shrink-0 text-sm font-medium text-gray-900'>
                            {order.orderNumber}
                          </div>

                          {/* Thumbnails */}
                          <div className='w-40 shrink-0 flex items-center gap-1'>
                            {visibleThumbnails.length > 0 ? (
                              <>
                                {visibleThumbnails.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt=''
                                    className='w-10 h-10 object-cover rounded border border-gray-200'
                                  />
                                ))}
                                {extraThumbnailCount > 0 && (
                                  <span className='text-xs text-gray-500 ml-1'>+{extraThumbnailCount}</span>
                                )}
                              </>
                            ) : (
                              <span className='text-xs text-gray-400'>No image</span>
                            )}
                          </div>

                          {/* Date */}
                          <div className='w-28 shrink-0 text-sm text-gray-700'>
                            {formatCompactDate(order.createdAt)}
                          </div>

                          {/* Price */}
                          <div className='w-32 shrink-0 text-sm text-gray-900'>
                            ${order.total.toFixed(2)} (CAD)
                          </div>

                          <div className='w-px self-stretch bg-gray-200' />

                          {/* Status + shipping details link */}
                          <div className='w-32 shrink-0'>
                            <p className='text-sm text-gray-900'>{order.orderStatus}</p>
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className='text-xs text-orange-500 underline'
                            >
                              Shipping Details
                            </button>
                          </div>

                          {/* Actions */}
                          <div className='flex items-center gap-2 ml-auto'>
                            <button
                              onClick={() => handleReorder(order)}
                              disabled={reorderingOrderId === order.id}
                              className='px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded transition'
                            >
                              {reorderingOrderId === order.id ? 'Adding to Cart...' : 'Reorder'}
                            </button>
                            <button
                              onClick={() => downloadReceipt(order)}
                              disabled={downloadingReceiptId === order.id}
                              className='px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded transition'
                            >
                              {downloadingReceiptId === order.id ? 'Generating...' : 'View Receipt'}
                            </button>
                            <button
                              onClick={() => toggleFavorite(order.id)}
                              aria-label='Toggle favorite'
                              className='p-1'
                            >
                              <Star
                                size={18}
                                className={favoriteOrderIds.has(order.id) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Order Details */}
                        {expandedOrderId === order.id && (
                          <div className='border-t border-gray-200 p-6 bg-gray-50'>
                          {/* Order Items */}
                          <div className='mb-6'>
                            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Items</h4>
                            <div className='space-y-4'>
                              {order.orderItems.map((item) => (
                                <div key={item.id} className='bg-white rounded-lg p-4 flex gap-4'>
                                  <div className='flex-1'>
                                    <h5 className='font-semibold text-gray-900'>{item.product.name}</h5>
                                    <p className='text-gray-600 text-sm mt-1'>{item.product.materials}</p>
                                    <div className='mt-2 text-sm text-gray-600'>
                                      <p>Quantity: {item.quantity}</p>
                                      <p>Size: {formatSizeDisplay(item)}</p>
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <p className='text-lg font-semibold text-gray-900'>
                                      ${item.totalPrice.toFixed(2)}
                                    </p>
                                    <p className='text-gray-600 text-sm'>
                                      ${(item.totalPrice / item.quantity).toFixed(2)} each
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className='mb-6 bg-white rounded-lg p-4'>
                            <div className='space-y-2'>
                              <div className='flex justify-between'>
                                <span className='text-gray-600'>Subtotal:</span>
                                <span className='font-medium'>${order.subtotal.toFixed(2)}</span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-gray-600'>Shipping:</span>
                                <span className='font-medium'>${order.shippingCost.toFixed(2)}</span>
                              </div>
                              <div className='border-t border-gray-200 pt-2 flex justify-between'>
                                <span className='font-semibold text-gray-900'>Total:</span>
                                <span className='font-bold text-lg'>${order.total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping & Payment Info */}
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                            {/* Shipping Address */}
                            <div className='bg-white rounded-lg p-4'>
                              <h5 className='font-semibold text-gray-900 mb-3'>Shipping Address</h5>
                              <p className='text-gray-700'>{order.shippingAddress.street}</p>
                              {order.shippingAddress.city && (
                                <p className='text-gray-700'>
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipcode}
                                </p>
                              )}
                              <p className='text-gray-700'>{order.shippingAddress.country}</p>
                              {order.shippingAddress.phoneNumber && (
                                <p className='text-gray-700 mt-2'>{order.shippingAddress.phoneNumber}</p>
                              )}
                            </div>

                            {/* Payment Info */}
                            <div className='bg-white rounded-lg p-4'>
                              <h5 className='font-semibold text-gray-900 mb-3'>Payment Info</h5>
                              <p className='text-gray-700'>
                                <span className='text-gray-600'>Method:</span> {order.paymentMethod}
                              </p>
                              <p className='text-gray-700'>
                                <span className='text-gray-600'>Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </p>
                            </div>
                          </div>

                        </div>
                      )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
                  <p className='text-gray-700 text-lg'>
                    {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                  </p>
                </div>
              )}

              {/* Results Count */}
              {orders.length > 0 && (
                <div className='mt-6 text-gray-600 text-sm'>
                  Showing {filteredOrders.length} of {orders.length} order(s)
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default OrderHistory
