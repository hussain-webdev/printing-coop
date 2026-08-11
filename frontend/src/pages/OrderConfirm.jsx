import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const OrderConfirm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (location.state?.order) {
      setOrder(location.state.order)
    }
  }, [location.state])

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='max-w-2xl mx-auto px-4 py-8'>
          <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
            <div className='bg-orange-500 px-6 py-5'>
              <h1 className='text-sm font-bold uppercase tracking-wide text-slate-900'>{t('orderConfirm.title')}</h1>
            </div>

            <div className='px-6 py-10 text-center'>
              <div className='flex justify-center mb-6'>
                <CheckCircle size={64} className='text-green-600' />
              </div>

              <h2 className='text-2xl font-bold text-gray-900 mb-2'>{t('orderConfirm.successMessage')}</h2>
              <p className='text-gray-600 mb-6'>
                {t('orderConfirm.thankYou')}
              </p>

              {order && (
                <div className='border border-gray-200 rounded-lg p-6 text-left max-w-md mx-auto mb-8'>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>{t('orderConfirm.orderNumber')}</span>
                      <span className='font-semibold text-gray-900'>{order.orderNumber}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>{t('orderConfirm.paymentMethod')}</span>
                      <span className='font-semibold text-gray-900'>{order.paymentMethod}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>{t('orderConfirm.paymentStatus')}</span>
                      <span className='font-semibold text-green-600'>{order.paymentStatus}</span>
                    </div>
                    <div className='flex justify-between border-t border-gray-200 pt-2 mt-2'>
                      <span className='font-bold text-gray-900'>{t('orderConfirm.totalPaid')}</span>
                      <span className='text-lg font-bold text-gray-900'>${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={() => navigate('/order-history')}
                  className='px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                >
                  {t('orderConfirm.viewOrderHistory')}
                </button>
                <button
                  onClick={() => navigate('/dashboard-banner')}
                  className='px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                >
                  {t('orderConfirm.continueShopping')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default OrderConfirm
