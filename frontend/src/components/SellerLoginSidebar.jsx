import React, { useState } from 'react'
import { X, Mail, Lock, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const SellerLoginSidebar = ({ isOpen, onClose, onForgotPasswordClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

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

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
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
      const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/login`, {
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
        localStorage.setItem('sellerToken', data.token)
        localStorage.setItem('sellerEmail', formData.email)
        localStorage.setItem('userType', 'wholesale-seller')
        toast.success('Login successful! Redirecting...')
        onClose()
        setTimeout(() => {
          window.location.href = '/dashboard-banner'
        }, 1000)
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
          <h1 className='text-4xl font-bold mb-8 text-black'>Login</h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Input */}
            <div>
              <label className='block text-black font-semibold mb-3'>Email</label>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                className='w-full pb-2 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none text-black'
                placeholder='Enter your email'
              />
              {errors.email && (
                <p className='text-red-500 text-sm mt-2'>{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className='block text-black font-semibold mb-3'>Password</label>
              <input
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                className='w-full pb-2 border-b-2 border-gray-300 focus:border-green-500 focus:outline-none text-black'
                placeholder='Enter your password'
              />
              {errors.password && (
                <p className='text-red-500 text-sm mt-2'>{errors.password}</p>
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
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className='text-center mt-8'>
              <button
                type='button'
                onClick={() => {
                  onClose()
                  setTimeout(() => onForgotPasswordClick(), 300)
                }}
                className='text-blue-500 hover:text-blue-700 underline font-semibold'
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default SellerLoginSidebar
