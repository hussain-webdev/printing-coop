import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader, Building2, Phone, MapPin, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'

const WholeSaleSellerRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    address2: '',
    companyName: '',
    country: '',
    city: '',
    state: '',
    zipcode: '',
    website: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
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

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State/Province is required'
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'Zip code is required'
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
      const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phoneNumber: formData.phoneNumber.trim(),
          address: formData.address.trim(),
          address2: formData.address2.trim(),
          companyName: formData.companyName.trim(),
          country: formData.country.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipcode: formData.zipcode.trim(),
          website: formData.website.trim()
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        localStorage.setItem('sellerToken', data.token)
        localStorage.setItem('sellerEmail', formData.email)
        localStorage.setItem('sellerName', formData.name.trim())
        localStorage.setItem('sellerCompany', formData.companyName.trim())
        toast.success('Registration successful! Redirecting...')
        navigate('/dashboard-banner')
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
        <div className='w-full max-w-2xl'>
          <div className=' rounded-lg shadow-2xl overflow-hidden border-2 border-blue-900'>
            {/* Header */}
            <div className='bg-orange-400 px-6 py-8 text-center'>
              <h1 className='text-4xl font-bold text-white mb-2'>WHOLESALE SELLER</h1>
              <p className='text-white'>Register your wholesale business today</p>
            </div>
  
            {/* Form */}
            <form onSubmit={handleSubmit} className='p-6 md:p-8'>
              {/* Personal Information Section */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-orange-500 mb-4 flex items-center gap-2'>
                  <User size={20} /> Personal Information
                </h3>
  
                {/* Name Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Full Name</label>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='John Doe'
                    className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
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
  
                {/* Phone Number Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>
                    <Phone className='inline mr-2' size={16} />
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    name='phoneNumber'
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder='+1 (555) 123-4567'
                    className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                      errors.phoneNumber 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-blue-900 focus:border-orange-500'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className='text-red-400 text-sm mt-2'>{errors.phoneNumber}</p>
                  )}
                </div>
              </div>
  
              {/* Company Information Section */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-orange-500 mb-4 flex items-center gap-2'>
                  <Building2 size={20} /> Company Information
                </h3>
  
                {/* Company Name Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Company Name</label>
                  <input
                    type='text'
                    name='companyName'
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder='Your Company Inc.'
                    className={`w-full px-4 py-3 border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                      errors.companyName 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-blue-900 focus:border-orange-500'
                    }`}
                  />
                  {errors.companyName && (
                    <p className='text-red-400 text-sm mt-2'>{errors.companyName}</p>
                  )}
                </div>
  
                {/* Website Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>
                    <Globe className='inline mr-2' size={16} />
                    Website (Optional)
                  </label>
                  <input
                    type='url'
                    name='website'
                    value={formData.website}
                    onChange={handleChange}
                    placeholder='https://example.com'
                    className='w-full px-4 py-3  border-2 border-blue-900 rounded-lg  placeholder-gray-500 focus:outline-none focus:border-orange-500 transition duration-200'
                  />
                </div>
              </div>
  
              {/* Address Information Section */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-orange-500 mb-4 flex items-center gap-2'>
                  <MapPin size={20} /> Address Information
                </h3>
  
                {/* Address Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Street Address</label>
                  <input
                    type='text'
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='123 Main Street'
                    className={`w-full px-4 py-3  border-2 rounded-lg placeholder-gray-500 focus:outline-none transition duration-200 ${
                      errors.address 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-blue-900 focus:border-orange-500'
                    }`}
                  />
                  {errors.address && (
                    <p className='text-red-400 text-sm mt-2'>{errors.address}</p>
                  )}
                </div>
  
                {/* Address 2 Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Street Address 2 (Optional)</label>
                  <input
                    type='text'
                    name='address2'
                    value={formData.address2}
                    onChange={handleChange}
                    placeholder='Suite, apartment, etc.'
                    className='w-full px-4 py-3  border-2 border-blue-900 rounded-lg  placeholder-gray-500 focus:outline-none focus:border-orange-500 transition duration-200'
                  />
                </div>
  
                {/* Country Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Country</label>
                  <input
                    type='text'
                    name='country'
                    value={formData.country}
                    onChange={handleChange}
                    placeholder='Canada'
                    className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                      errors.country 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-blue-900 focus:border-orange-500'
                    }`}
                  />
                  {errors.country && (
                    <p className='text-red-400 text-sm mt-2'>{errors.country}</p>
                  )}
                </div>
  
                {/* City, State, Zip - Row */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-5'>
                  {/* City Input */}
                  <div>
                    <label className='block text-sm font-semibold  mb-2'>City</label>
                    <input
                      type='text'
                      name='city'
                      value={formData.city}
                      onChange={handleChange}
                      placeholder='Montreal'
                      className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                        errors.city 
                          ? 'border-red-500 focus:border-red-600' 
                          : 'border-blue-900 focus:border-orange-500'
                      }`}
                    />
                    {errors.city && (
                      <p className='text-red-400 text-sm mt-2'>{errors.city}</p>
                    )}
                  </div>
  
                  {/* State Input */}
                  <div>
                    <label className='block text-sm font-semibold  mb-2'>State/Province</label>
                    <input
                      type='text'
                      name='state'
                      value={formData.state}
                      onChange={handleChange}
                      placeholder='Quebec'
                      className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                        errors.state 
                          ? 'border-red-500 focus:border-red-600' 
                          : 'border-blue-900 focus:border-orange-500'
                      }`}
                    />
                    {errors.state && (
                      <p className='text-red-400 text-sm mt-2'>{errors.state}</p>
                    )}
                  </div>
  
                  {/* Zip Code Input */}
                  <div>
                    <label className='block text-sm font-semibold  mb-2'>Zip Code</label>
                    <input
                      type='text'
                      name='zipcode'
                      value={formData.zipcode}
                      onChange={handleChange}
                      placeholder='H2M 1S2'
                      className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                        errors.zipcode 
                          ? 'border-red-500 focus:border-red-600' 
                          : 'border-blue-900 focus:border-orange-500'
                      }`}
                    />
                    {errors.zipcode && (
                      <p className='text-red-400 text-sm mt-2'>{errors.zipcode}</p>
                    )}
                  </div>
                </div>
              </div>
  
              {/* Security Section */}
              <div className='mb-6'>
                <h3 className='text-lg font-semibold text-orange-500 mb-4 flex items-center gap-2'>
                  <Lock size={20} /> Security Information
                </h3>
  
                {/* Password Input */}
                <div className='mb-5'>
                  <label className='block text-sm font-semibold  mb-2'>Password</label>
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
  
                {/* Confirm Password Input */}
                <div className='mb-6'>
                  <label className='block text-sm font-semibold  mb-2'>Confirm Password</label>
                  <input
                    type='password'
                    name='confirmPassword'
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder='••••••••'
                    className={`w-full px-4 py-3  border-2 rounded-lg  placeholder-gray-500 focus:outline-none transition duration-200 ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-blue-900 focus:border-orange-500'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className='text-red-400 text-sm mt-2'>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
  
              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading}
                className='w-full bg-orange-400 hover:bg-orange-500 disabled:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 mb-4'
              >
                {loading ? (
                  <>
                    <Loader size={20} className='animate-spin' />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'REGISTER WHOLESALE ACCOUNT'
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
                  Already a wholesale seller?{' '}
                  <button
                    type='button'
                    onClick={() => navigate('/login-user')}
                    className='text-orange-500 hover:text-orange-400 font-semibold transition duration-200'
                  >
                    Login here
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

export default WholeSaleSellerRegister
