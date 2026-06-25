import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

const UserLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('customer')

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
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
      // Determine the API endpoint based on login type
      const endpoint = loginType === 'customer' 
        ? `${BACKEND_URL}/api/user/login`
        : `${BACKEND_URL}/api/wholesale-seller/login`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Store tokens and data based on login type
        if (loginType === 'customer') {
          localStorage.setItem('token', data.token)
          localStorage.setItem('userEmail', formData.email)
          localStorage.setItem('userType', 'customer')
        } else {
          localStorage.setItem('sellerToken', data.token)
          localStorage.setItem('sellerEmail', formData.email)
          localStorage.setItem('userType', 'wholesale-seller')
        }
        toast.success('Login successful! Redirecting...')
        navigate('/dashboard-banner')
      } else {
        toast.error(data.message || 'Login failed. Please try again.')
      }
    } catch (error) {
      toast.error('Connection error. Please check your backend server.')
      console.error('Login error:', error)
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
              <h1 className='text-4xl font-bold text-white mb-2'>Login</h1>
              <p className='text-white'>Welcome back to Printing Coop</p>
            </div>
  
            {/* Form */}
            <form onSubmit={handleSubmit} className='p-6 md:p-8'>
              {/* Email Input */}
              <div className='mb-6'>
                <label className='block text-sm font-semibold  mb-2'>
                  <Mail className='inline mr-2' size={16} />
                  Email Address
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='your@email.com'
                  className={`w-full px-4 py-3 border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-blue-900 focus:border-orange-500'
                  }`}
                />
                {errors.email && (
                  <p className='text-red-400 text-sm mt-2'>{errors.email}</p>
                )}
              </div>
  
              {/* Password Input */}
              <div className='mb-6'>
                <label className='block text-sm font-semibold  mb-2'>
                  <Lock className='inline mr-2' size={16} />
                  Password
                </label>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-blue-900 focus:border-orange-500'
                  }`}
                />
                {errors.password && (
                  <p className='text-red-400 text-sm mt-2'>{errors.password}</p>
                )}
              </div>
  
              {/* Login Type Selector */}
              <div className='mb-6'>
                <label className='block text-sm font-semibold  mb-2'>
                  Login as:
                </label>
                <select
                  value={loginType}
                  onChange={(e) => setLoginType(e.target.value)}
                  className='w-full px-4 py-3 border-2 border-blue-900 rounded-lg  focus:outline-none focus:border-orange-500 transition duration-200 cursor-pointer'
                >
                  <option value='customer'>Customer</option>
                  <option value='wholesale-seller'>Wholesale Seller</option>
                </select>
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
                    LOGGING IN...
                  </>
                ) : (
                  'LOGIN'
                )}
              </button>
  
              {/* Forgot Password Link */}
              <div className='text-center mt-4 mb-4'>
                <button
                  type='button'
                  onClick={() => navigate('/forgot-password')}
                  className='text-orange-500 hover:text-orange-400 font-semibold transition duration-200 text-sm'
                >
                  Forgot Password?
                </button>
              </div>
  
              {/* Divider */}
              <div className='my-6 flex items-center'>
                <div className='flex-1 border-t border-blue-900'></div>
                <span className='px-3 text-gray-400 text-sm'>OR</span>
                <div className='flex-1 border-t border-blue-900'></div>
              </div>
  
              {/* Register Link */}
              <div className='text-center'>
                <p className='text-gray-400 text-sm'>
                  Don&apos;t have an account?{' '}
                  <button
                    type='button'
                    onClick={() => navigate('/register-user')}
                    className='text-orange-500 hover:text-orange-400 font-semibold transition duration-200'
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </div>
  
          {/* Footer Text */}
          <div className='text-center mt-6 text-gray-400 text-xs'>
            <p>Your login credentials are secure and encrypted</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserLogin
