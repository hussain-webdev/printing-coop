import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Loader, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(true)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false)
    }
  }, [token])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Try customer (user) reset password first
      const customerResponse = await fetch(`${BACKEND_URL}/api/user/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password
        })
      })

      const customerData = await customerResponse.json()

      if (customerData.success) {
        toast.success('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // If customer reset fails, try wholesale seller reset
      const sellerResponse = await fetch(`${BACKEND_URL}/api/wholesale-seller/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password
        })
      })

      const sellerData = await sellerResponse.json()

      if (sellerData.success) {
        toast.success('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // If both fail, check for error messages
      const errorMessage = customerData.message || sellerData.message || 'Failed to reset password. Please try again.'
      toast.error(errorMessage)
      
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        setIsTokenValid(false)
      }
    } catch (error) {
      toast.error('Connection error. Please check your backend server.')
      console.error('Reset password error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isTokenValid) {
    return (
      <>
      <div>
        <img className='w-60 p-4' src="/printing_coopLogo2.png" alt="" />
      </div>
        <div className='min-h-screen flex items-center justify-center px-4 py-8'>
          <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-8'>
            <h1 className='text-3xl font-bold mb-2 text-black'>Reset Password</h1>
            <p className='text-gray-600 mb-8'>Create a new password</p>

            <div className='text-center py-4'>
              <div className='mb-4 flex justify-center'>
                <div className='bg-red-100 rounded-full p-4'>
                  <AlertCircle size={32} className='text-red-600' />
                </div>
              </div>
              <h2 className='text-xl font-semibold mb-2 text-red-600'>Invalid or Expired Link</h2>
              <p className='text-gray-600 text-sm mb-6'>
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate('/')}
                className='w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded transition duration-200'
              >
                Request New Link
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
    <div>
      <img className='w-60 p-4' src="/printing_coopLogo2.png" alt="" />
    </div>
      <div className='min-h-screen flex items-center justify-center px-4'>
        <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-8'>
          <h1 className='text-3xl font-bold mb-2 text-black'>Reset Password</h1>
          <p className='text-gray-600 mb-8'>Create a new password</p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-black font-semibold mb-3'>New Password</label>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                className={`w-full pb-2 border-b-2 focus:outline-none text-black ${
                  errors.password ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
                placeholder='Enter your new password'
              />
              {errors.password && (
                <p className='text-red-500 text-sm mt-2'>{errors.password}</p>
              )}
            </div>

            <div>
              <label className='block text-black font-semibold mb-3'>Confirm Password</label>
              <input
                type='password'
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pb-2 border-b-2 focus:outline-none text-black ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
                placeholder='Confirm your new password'
              />
              {errors.confirmPassword && (
                <p className='text-red-500 text-sm mt-2'>{errors.confirmPassword}</p>
              )}
            </div>

            <div className='flex justify-center pt-2'>
              <button
                type='submit'
                disabled={loading}
                className='bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-bold py-3 px-12 rounded transition duration-200 flex items-center gap-2'
              >
                {loading ? (
                  <>
                    <Loader size={18} className='animate-spin' />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default ResetPassword
