import React, { useState } from 'react'
import { X, Mail, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const SellerForgotPasswordSidebar = ({ isOpen, onClose, onReturnToLogin }) => {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors({})
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Reset link sent to your email!')
        setEmailSent(true)
      } else {
        toast.error(data.message || 'Failed to send reset link. Please try again.')
      }
    } catch (error) {
      toast.error('Connection error. Please check your backend server.')
      console.error('Forgot password error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setEmail('')
    setEmailSent(false)
    setErrors({})
    onClose()
    setTimeout(() => onReturnToLogin(), 300)
  }

  return (
    <>

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-screen w-80 bg-white z-50 shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Close Button */}
        <div className='flex justify-end p-6'>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition'
          >
            <X size={24} className='text-black' />
          </button>
        </div>

        {/* Form Content */}
        <div className='px-8 pb-8'>
          <h1 className='text-4xl font-bold mb-8 text-black'>Reset Password</h1>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Email Input */}
              <div>
                <label className='block text-black font-semibold mb-3'>Email</label>
                <input
                  type='email'
                  value={email}
                  onChange={handleChange}
                  className='w-full pb-2 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none text-black'
                  placeholder='Enter your email'
                />
                {errors.email && (
                  <p className='text-red-500 text-sm mt-2'>{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className='flex justify-center pt-6'>
                <button
                  type='submit'
                  disabled={loading}
                  className='bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-bold py-3 px-12 rounded transition duration-200 flex items-center gap-2'
                >
                  {loading ? (
                    <>
                      <Loader size={18} className='animate-spin' />
                      Sending...
                    </>
                  ) : (
                    'Reset'
                  )}
                </button>
              </div>

              {/* Return to Login Link */}
              <div className='text-center mt-8'>
                <button
                  type='button'
                  onClick={handleReset}
                  className='text-blue-500 hover:text-blue-700 underline font-semibold'
                >
                  Return to login
                </button>
              </div>
            </form>
          ) : (
            <div className='text-center py-8'>
              <Mail size={48} className='text-green-500 mx-auto mb-4' />
              <p className='text-gray-700 mb-6'>
                Reset link sent to your email. Please check your inbox and follow the instructions.
              </p>
              <button
                onClick={handleReset}
                className='text-blue-500 hover:text-blue-700 underline font-semibold'
              >
                Return to login
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SellerForgotPasswordSidebar
