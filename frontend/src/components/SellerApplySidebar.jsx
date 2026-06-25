import React, { useState } from 'react'
import { X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const SellerApplySidebar = ({ isOpen, onClose }) => {
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
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!formData.country) newErrors.country = 'Country is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zipcode.trim()) newErrors.zipcode = 'Zipcode is required'
    
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
      const response = await fetch(`${BACKEND_URL}/api/wholesale-seller/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          address: formData.address.trim(),
          address2: formData.address2.trim() || undefined,
          companyName: formData.companyName.trim(),
          country: formData.country,
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipcode: formData.zipcode.trim(),
          website: formData.website.trim() || undefined
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        localStorage.setItem('sellerToken', data.token)
        localStorage.setItem('sellerEmail', formData.email)
        localStorage.setItem('sellerName', formData.name.trim())
        localStorage.setItem('userType', 'wholesale-seller')
        toast.success('Registration successful! Redirecting...')
        onClose()
        setTimeout(() => {
          window.location.href = '/dashboard-banner'
        }, 1000)
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
      

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-screen w-96 bg-white z-50 shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Close Button */}
        <div className='flex justify-end p-6 sticky top-0 bg-white z-10'>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition'
          >
            <X size={24} className='text-black' />
          </button>
        </div>

        {/* Form Content */}
        <div className='px-8 pb-12'>
          <h1 className='text-4xl font-bold mb-8 text-black'>Apply</h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Personal Information Section */}
            <div className='space-y-6'>
              <h2 className='text-lg font-semibold text-gray-700 mt-6'>Personal Information</h2>
              
              {/* Name */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Name</label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Full name'
                />
                {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Email</label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Email address'
                />
                {errors.email && <p className='text-red-500 text-xs mt-1'>{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Phone Number</label>
                <input
                  type='tel'
                  name='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Phone number'
                />
                {errors.phoneNumber && <p className='text-red-500 text-xs mt-1'>{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Company Information Section */}
            <div className='space-y-6'>
              <h2 className='text-lg font-semibold text-gray-700 mt-6'>Company Information</h2>
              
              {/* Company Name */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Company Name</label>
                <input
                  type='text'
                  name='companyName'
                  value={formData.companyName}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Company name'
                />
                {errors.companyName && <p className='text-red-500 text-xs mt-1'>{errors.companyName}</p>}
              </div>

              {/* Website */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Website (Optional)</label>
                <input
                  type='url'
                  name='website'
                  value={formData.website}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Website URL'
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className='space-y-6'>
              <h2 className='text-lg font-semibold text-gray-700 mt-6'>Address Information</h2>
              
              {/* Address */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Address</label>
                <input
                  type='text'
                  name='address'
                  value={formData.address}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Street address'
                />
                {errors.address && <p className='text-red-500 text-xs mt-1'>{errors.address}</p>}
              </div>

              {/* Address 2 */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Address 2 (Optional)</label>
                <input
                  type='text'
                  name='address2'
                  value={formData.address2}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Apartment, suite, etc.'
                />
              </div>

              {/* Country */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Country</label>
                <input
                  type='text'
                  name='country'
                  value={formData.country}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Country'
                />
                {errors.country && <p className='text-red-500 text-xs mt-1'>{errors.country}</p>}
              </div>

              {/* City and State */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-black font-semibold mb-2 text-sm'>City</label>
                  <input
                    type='text'
                    name='city'
                    value={formData.city}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                    placeholder='City'
                  />
                  {errors.city && <p className='text-red-500 text-xs mt-1'>{errors.city}</p>}
                </div>
                <div>
                  <label className='block text-black font-semibold mb-2 text-sm'>State</label>
                  <input
                    type='text'
                    name='state'
                    value={formData.state}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                    placeholder='State'
                  />
                  {errors.state && <p className='text-red-500 text-xs mt-1'>{errors.state}</p>}
                </div>
              </div>

              {/* Zipcode */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Zipcode</label>
                <input
                  type='text'
                  name='zipcode'
                  value={formData.zipcode}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Zipcode'
                />
                {errors.zipcode && <p className='text-red-500 text-xs mt-1'>{errors.zipcode}</p>}
              </div>
            </div>

            {/* Security Information Section */}
            <div className='space-y-6'>
              <h2 className='text-lg font-semibold text-gray-700 mt-6'>Security Information</h2>
              
              {/* Password */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Password</label>
                <input
                  type='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Password (min 8 characters)'
                />
                {errors.password && <p className='text-red-500 text-xs mt-1'>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className='block text-black font-semibold mb-2 text-sm'>Confirm Password</label>
                <input
                  type='password'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border-b-2 border-gray-300  focus:outline-none focus:border-green-500 text-black text-sm'
                  placeholder='Confirm password'
                />
                {errors.confirmPassword && <p className='text-red-500 text-xs mt-1'>{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className='flex justify-center pt-8 pb-4'>
              <button
                type='submit'
                disabled={loading}
                className='bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-bold py-3 px-12 rounded transition duration-200 flex items-center gap-2'
              >
                {loading ? (
                  <>
                    <Loader size={18} className='animate-spin' />
                    Creating Account...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default SellerApplySidebar
