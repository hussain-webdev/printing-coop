import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Loader, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { value } = e.target
    setEmail(value)
    if (errors.email) {
      setErrors({})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Try customer (user) forgot password first
      const customerResponse = await fetch(`${BACKEND_URL}/api/user/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const customerData = await customerResponse.json()

      if (customerData.success) {
        toast.success('Reset link sent to your email!')
        setEmailSent(true)
        return
      }

      // If customer not found, try wholesale seller forgot password
      const sellerResponse = await fetch(`${BACKEND_URL}/api/wholesale-seller/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const sellerData = await sellerResponse.json()

      if (sellerData.success) {
        toast.success('Reset link sent to your email!')
        setEmailSent(true)
        return
      }

      // If neither customer nor seller found
      toast.error('Email not found in our system. Please check and try again.')
    } catch (error) {
      toast.error('Connection error. Please check your backend server.')
      console.error('Forgot password error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Navbar />
      <div className='min-h-screen flex items-center justify-center px-4 py-8'>
        <div className='w-full max-w-md'>
          <div className='rounded-lg shadow-2xl overflow-hidden border-2 border-blue-900'>
            {/* Header */}
            <div className='bg-orange-400 px-6 py-8 text-center'>
              <h1 className='text-4xl font-bold text-white mb-2'>FORGOT PASSWORD</h1>
              <p className='text-white'>Reset your password easily</p>
            </div>
  
            {/* Form */}
            <form onSubmit={handleSubmit} className='p-6 md:p-8'>
              {!emailSent ? (
                <>
                  <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-blue-800'>
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>
  
                  {/* Email Input */}
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold mb-2'>
                      <Mail className='inline mr-2' size={16} />
                      Email Address
                    </label>
                    <input
                      type='email'
                      value={email}
                      onChange={handleChange}
                      placeholder='your@email.com'
                      className={`w-full px-4 py-3 border-2 rounded-lg placeholder-gray-500 focus:outline-none transition duration-200 ${
                        errors.email 
                          ? 'border-red-500 focus:border-red-600' 
                          : 'border-blue-900 focus:border-orange-500'
                      }`}
                    />
                    {errors.email && (
                      <p className='text-red-400 text-sm mt-2'>{errors.email}</p>
                    )}
                  </div>
  
                  {/* Submit Button */}
                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-orange-400 hover:bg-orange-500 disabled:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2'
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className='animate-spin' />
                        SENDING...
                      </>
                    ) : (
                      'SEND RESET LINK'
                    )}
                  </button>
                </>
              ) : (
                <div className='text-center py-6'>
                  <div className='mb-4 flex justify-center'>
                    <div className='bg-green-100 rounded-full p-4'>
                      <Mail size={32} className='text-green-600' />
                    </div>
                  </div>
                  <h2 className='text-xl font-bold mb-2'>Check Your Email</h2>
                  <p className='text-gray-600 text-sm mb-4'>
                    We&apos;ve sent a password reset link to <strong>{email}</strong>. The link will expire in 10 minutes.
                  </p>
                  <p className='text-gray-500 text-sm mb-6'>
                    Didn&apos;t receive the email? Check your spam folder.
                  </p>
                </div>
              )}
  
              {/* Divider */}
              <div className='my-6 flex items-center'>
                <div className='flex-1 border-t border-blue-900'></div>
                <span className='px-3 text-gray-400 text-sm'>OR</span>
                <div className='flex-1 border-t border-blue-900'></div>
              </div>
  
              {/* Back to Login Link */}
              <div className='text-center'>
                <button
                  type='button'
                  onClick={() => navigate('/login-user')}
                  className='text-gray-600 hover:text-orange-500 font-semibold transition duration-200 flex items-center justify-center gap-2'
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </button>
              </div>
            </form>
          </div>
  
          {/* Footer Text */}
          <div className='text-center mt-6 text-gray-400 text-xs'>
            <p>Your email address is secure and encrypted</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForgotPassword
