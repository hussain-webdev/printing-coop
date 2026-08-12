import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const AUTHORIZENET_PUBLIC_CLIENT_KEY = import.meta.env.VITE_AUTHORIZENET_PUBLIC_CLIENT_KEY
const AUTHORIZENET_LOGIN_ID = import.meta.env.VITE_AUTHORIZENET_LOGIN_ID

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
const getEmailLanguage = () => (localStorage.getItem('i18nextLng') || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'

// Stripe card form component
const StripeCardForm = ({ orderData, onPaymentSuccess, processing, setProcessing }) => {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState(null)
  const [loadingIntent, setLoadingIntent] = useState(true)

  // Step 1: Create Payment Intent on mount
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoadingIntent(true)
        const response = await fetch(`${BACKEND_URL}/api/order/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wholesaleSellerId: orderData.wholesaleSellerId,
            shippingCost: orderData.shippingCost,
            orderItems: orderData.orderItems,
          }),
        })

        const data = await response.json()
        if (data.success) {
          setClientSecret(data.clientSecret)
          console.log('[v0] Payment Intent created:', data.paymentIntentId)
        } else {
          toast.error(data.message || t('payment.loadingPayment'))
          navigate('/place-order')
        }
      } catch (error) {
        console.error('[v0] Error creating payment intent:', error)
        toast.error(t('payment.loadingPayment'))
        navigate('/place-order')
      } finally {
        setLoadingIntent(false)
      }
    }

    createPaymentIntent()
  }, [orderData, navigate])

  // Step 2: Handle payment confirmation
  const handlePayment = async (e) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      toast.error(t('payment.loadingPayment'))
      return
    }

    setProcessing(true)

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      })

      if (error) {
        console.error('[v0] Stripe error:', error)
        toast.error(error.message || t('payment.loadingPayment'))
        setProcessing(false)
        return
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('[v0] Payment succeeded:', paymentIntent.id)

        // Step 3: Confirm payment on backend and create order
        const confirmResponse = await fetch(`${BACKEND_URL}/api/order/confirm-stripe-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
paymentIntentId: paymentIntent.id,
            wholesaleSellerId: orderData.wholesaleSellerId,
            shippingCost: orderData.shippingCost,
            shippingAddress: orderData.shippingAddress,
            orderItems: orderData.orderItems,
            lang: getEmailLanguage(),
          }),
        })

        const confirmData = await confirmResponse.json()

        if (confirmData.success) {
          sessionStorage.removeItem('pendingOrder')
          toast.success(t('payment.paymentSuccess'))
          onPaymentSuccess(confirmData.order)
          navigate('/order-confirm', { state: { order: confirmData.order } })
        } else {
          toast.error(confirmData.message || t('payment.loadingPayment'))
        }
      }
    } catch (error) {
      console.error('[v0] Payment error:', error)
      toast.error(t('payment.loadingPayment'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className='space-y-6'>
      <div className='bg-white rounded-lg p-6'>
        <label className='block text-sm font-semibold text-gray-900 mb-3'>{t('payment.cardDetails')}</label>
        <div className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
          {loadingIntent ? (
            <div className='flex items-center gap-2 py-3 text-sm text-gray-600'>
              <Loader size={16} className='animate-spin' />
              {t('payment.loadingPayment')}
            </div>
          ) : (
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          )}
        </div>
      </div>

      <button
        type='submit'
        disabled={processing || !stripe || !clientSecret || loadingIntent}
        className='w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition'
      >
        {processing ? (
          <div className='flex items-center justify-center gap-2'>
            <Loader size={16} className='animate-spin' />
            {t('payment.processingPayment')}
          </div>
        ) : (
          `${t('payment.title')} $${Number(orderData.total).toFixed(2)}`
        )}
      </button>
    </form>
  )
}

const AuthorizeNetCardForm = ({ orderData, processing, setProcessing }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scriptReady, setScriptReady] = useState(false)
  const [card, setCard] = useState({ cardNumber: '', expirationDate: '', cardCode: '', firstName: '', lastName: '' })

  useEffect(() => {
    if (window.Accept) {
      setScriptReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://jstest.authorize.net/v1/Accept.js'
    script.async = true
    script.onload = () => setScriptReady(true)
    script.onerror = () => toast.error('Unable to load Authorize.net payment form')
    document.body.appendChild(script)
    return () => script.remove()
  }, [])

  const updateCard = (event) => setCard((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handlePayment = (event) => {
    event.preventDefault()

    // Authorize.net expects expirationDate in YYYY-MM format.
    const expirationDate = String(card.expirationDate).trim()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(expirationDate)) {
      setProcessing(false)
      toast.error('Enter expiration date as YYYY-MM, for example 2029-11')
      return
    }

    // Accept.js refuses to tokenize card data from an insecure HTTP page.
    if (!window.isSecureContext) {
      toast.error('Authorize.net requires HTTPS. Open the deployed HTTPS site or use an HTTPS local dev server.')
      return
    }

    if (!scriptReady || !window.Accept) return toast.error('Payment system is not ready')
    setProcessing(true)

    window.Accept.dispatchData({
      authData: {
        clientKey: AUTHORIZENET_PUBLIC_CLIENT_KEY,
        apiLoginID: AUTHORIZENET_LOGIN_ID,
      },
      cardData: {
        ...card,
        expirationDate,
      },
    }, async (response) => {
      if (response.messages?.resultCode !== 'Ok') {
        setProcessing(false)
        return toast.error(response.messages?.message?.[0]?.text || 'Card validation failed')
      }
      try {
        const paymentResponse = await fetch(`${BACKEND_URL}/api/order/charge-authorize-net`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentNonce: response.opaqueData,
            wholesaleSellerId: orderData.wholesaleSellerId,
            shippingCost: orderData.shippingCost,
            shippingAddress: orderData.shippingAddress,
            orderItems: orderData.orderItems,
            lang: getEmailLanguage(),
          }),
        })
        const result = await paymentResponse.json()
        if (!result.success) throw new Error(result.message || 'Payment failed')
        sessionStorage.removeItem('pendingOrder')
        toast.success(t('payment.paymentSuccess'))
        navigate('/order-confirm', { state: { order: result.order } })
      } catch (error) {
        console.error('[v0] Authorize.net payment error:', error)
        toast.error(error.message || 'Payment failed')
      } finally {
        setProcessing(false)
      }
    })
  }

  const fields = [
    ['cardNumber', 'Card number', '4242424242424242'],
    ['expirationDate', 'Expiration date', '2028-12'],
    ['cardCode', 'CVV', '123'],
    ['firstName', 'First name', 'Alex'],
    ['lastName', 'Last name', 'Seller'],
  ]

  return <form onSubmit={handlePayment} className='space-y-4 px-6 py-6'>
    {!window.isSecureContext && (
      <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
        Authorize.net requires a secure HTTPS connection before card details can be submitted.
      </div>
    )}
    {fields.map(([name, label, placeholder]) => (
      <label key={name} className='block text-sm font-medium text-gray-700'>
        {label}
        <input name={name} value={card[name]} onChange={updateCard} placeholder={placeholder} required autoComplete='off' inputMode={name === 'cardNumber' || name === 'cardCode' ? 'numeric' : undefined} className='mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5' />
      </label>
    ))}
    <button type='submit' disabled={processing || !scriptReady || !AUTHORIZENET_PUBLIC_CLIENT_KEY} className='w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400'>
      {processing ? t('payment.processingPayment') : `Pay $${Number(orderData.total).toFixed(2)}`}
    </button>
  </form>
}

const Payment = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [orderData, setOrderData] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('stripe')
  const [processing, setProcessing] = useState(false)

  // Load the pending order from router state (or sessionStorage fallback on refresh)
  useEffect(() => {
    let data = location.state
    if (!data) {
      const saved = sessionStorage.getItem('pendingOrder')
      if (saved) {
        data = JSON.parse(saved)
      }
    }

    if (!data || !data.orderItems || data.orderItems.length === 0) {
      toast.error(t('payment.noOrder'))
      navigate('/cart')
      return
    }

    setOrderData(data)
  }, [location.state, navigate])

  if (!orderData) {
    return (
      <div>
        <DashboardNavbar />
        <div className='pt-34 md:pt-30 pb-24 flex justify-center items-center py-16'>
          <Loader size={32} className='animate-spin text-gray-600' />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='max-w-5xl mx-auto px-4 py-8'>
          <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-8'>
            <div className='bg-orange-500 px-6 py-5'>
              <h1 className='text-sm font-bold uppercase tracking-wide text-slate-900'>{t('payment.title')}</h1>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column - Payment method */}
            <div className='lg:col-span-2 space-y-8'>
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('payment.selectPaymentMethod')}</h2>
                </div>

                <label className='flex items-center gap-3 px-6 py-4 cursor-pointer border-b border-gray-200'>
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='stripe'
                    checked={selectedMethod === 'stripe'}
                    onChange={() => setSelectedMethod('stripe')}
                  />
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>{t('payment.stripe')}</p>
                    <p className='text-xs text-gray-500 mt-0.5'>{t('payment.stripeDescription')}</p>
                  </div>
                </label>

                {/* Stripe Card Form */}
                {selectedMethod === 'stripe' && STRIPE_PUBLISHABLE_KEY && (
                  <div className='px-6 py-6'>
                    <Elements stripe={stripePromise}>
                      <StripeCardForm orderData={orderData} onPaymentSuccess={() => {}} processing={processing} setProcessing={setProcessing} />
                    </Elements>
                  </div>
                )}

                <label className='flex items-center gap-3 px-6 py-4 cursor-pointer border-t border-b border-gray-200'>
                  <input type='radio' name='paymentMethod' value='authorizeNet' checked={selectedMethod === 'authorizeNet'} onChange={() => setSelectedMethod('authorizeNet')} />
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>Authorize.net</p>
                    <p className='text-xs text-gray-500 mt-0.5'>Pay securely by card (sandbox test mode)</p>
                  </div>
                </label>

                {selectedMethod === 'authorizeNet' && (
                  AUTHORIZENET_PUBLIC_CLIENT_KEY && AUTHORIZENET_LOGIN_ID
                    ? <AuthorizeNetCardForm orderData={orderData} processing={processing} setProcessing={setProcessing} />
                    : <p className='px-6 py-6 text-sm text-red-600'>Set VITE_AUTHORIZENET_PUBLIC_CLIENT_KEY and VITE_AUTHORIZENET_LOGIN_ID in the frontend .env file.</p>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className='lg:col-span-1'>
              <div className='border border-gray-200 rounded-lg overflow-hidden shadow-sm sticky top-40'>
                <div className='bg-black px-6 py-2.5'>
                  <h2 className='text-xs font-bold uppercase tracking-wide text-white'>{t('payment.orderSummary')}</h2>
                </div>
                <div className='px-6 py-4'>
                  <div className='space-y-2 mb-4 text-sm'>
                    <div className='flex justify-between text-gray-700'>
                      <span>{t('payment.subtotal')}</span>
                      <span className='font-medium text-gray-900'>${Number(orderData.subtotal).toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-gray-700'>
                      <span>{t('payment.shipping')}</span>
                      <span className='font-medium text-gray-900'>${Number(orderData.shippingCost).toFixed(2)}</span>
                    </div>
                    <div className='border-t border-gray-200 pt-2 flex justify-between items-center'>
                      <span className='font-bold text-gray-900'>{t('payment.total')}</span>
                      <span className='text-lg font-bold text-gray-900'>${Number(orderData.total).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/place-order')}
                    className='w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wide rounded transition'
                  >
                    {t('payment.backToPlaceOrder')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Payment
