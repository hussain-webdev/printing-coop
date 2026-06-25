import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

const UserRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
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
      const response = await fetch(`${BACKEND_URL}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userEmail', formData.email)
        localStorage.setItem('userName', formData.name.trim())
        toast.success('Registration successful! Redirecting...')
        navigate('/')
      } else {
        toast.error(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      toast.error('Connection error. Please check your backend server.')
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Navbar />
      <div className='min-h-screen flex items-center justify-center px-4 py-8'>
        <div className='w-full max-w-md'>
          <div className=' rounded-lg shadow-2xl overflow-hidden border-2 border-blue-900'>
            {/* Header */}
            <div className='bg-orange-400 px-6 py-8 text-center'>
              <h1 className='text-4xl font-bold text-white mb-2'>SIGN UP</h1>
              <p className='text-white'>Join Printing Coop today</p>
            </div>
  
            {/* Form */}
            <form onSubmit={handleSubmit} className='p-6 md:p-8'>
              {/* Name Input */}
              <div className='mb-5'>
                <label className='block text-sm font-semibold mb-2'>
                  <User className='inline mr-2' size={16} />
                  Full Name
                </label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='John Doe'
                  className={`w-full px-4 py-3 border-2 rounded-lg placeholder-gray-500 focus:outline-none transition duration-200 ${
                    errors.name 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-blue-900 focus:border-orange-500'
                  }`}
                />
                {errors.name && (
                  <p className='text-red-400 text-sm mt-2'>{errors.name}</p>
                )}
              </div>
  
              {/* Email Input */}
              <div className='mb-5'>
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
                  className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
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
              <div className='mb-5'>
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
                  className={`w-full px-4 py-3 border-2 rounded-lg placeholder-gray-500 focus:outline-none transition duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-blue-900 focus:border-orange-500'
                  }`}
                />
                {errors.password && (
                  <p className='text-red-400 text-sm mt-2'>{errors.password}</p>
                )}
              </div>
  
              {/* Confirm Password Input */}
              <div className='mb-6'>
                <label className='block text-sm font-semibold mb-2'>
                  <Lock className='inline mr-2' size={16} />
                  Confirm Password
                </label>
                <input
                  type='password'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className={`w-full px-4 py-3 border-2 rounded-lg placeholder-gray-500 focus:outline-none transition duration-200 ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-blue-900 focus:border-orange-500'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className='text-red-400 text-sm mt-2'>{errors.confirmPassword}</p>
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
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
  
              {/* Divider */}
              <div className='my-6 flex items-center'>
                <div className='flex-1 border-t border-blue-900'></div>
                <span className='px-3 text-gray-400 text-sm'>OR</span>
                <div className='flex-1 border-t border-blue-900'></div>
              </div>
  
              {/* Login Link */}
              <div className='text-center'>
                <p className='text-gray-400 text-sm'>
                  Already have an account?{' '}
                  <button
                    type='button'
                    onClick={() => navigate('/login-user')}
                    className='text-orange-500 hover:text-orange-400 font-semibold transition duration-200'
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>
  
          {/* Footer Text */}
          <div className='text-center mt-6 text-gray-400 text-xs'>
            <p>Your information is secure and encrypted</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserRegister
