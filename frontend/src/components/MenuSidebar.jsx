import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

const MenuSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('additionalAddresses')
    localStorage.removeItem('sellerEmail')
    localStorage.removeItem('sellerId')
    localStorage.removeItem('sellerToken')
    localStorage.removeItem('userType')
    onClose()
    navigate('/')
  }

  const menuItems = [
    { label: 'MANAGE ACCOUNT', href: '/manage-account' },
    { label: 'MANAGE PAYMENTS', href: '/manage-payments' },
    { label: 'ORDER HISTORY', href: '/order-history' },
    { label: 'PRODUCT CATALOG', href: '#' },
    { label: 'HOW TO VIDEOS', href: '#' },
    { label: "WHAT'S NEW?", href: '#' },
    { label: 'LOGOUT', href: '#', onClick: handleLogout },
  ]

  return (
    <>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-screen w-80 bg-white z-50 shadow-lg transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className='flex justify-end p-6 sticky top-0 bg-white z-10 border-b border-gray-200'>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition'
          >
            <X size={24} className='text-black' />
          </button>
        </div>

        {/* Menu Items */}
        <div className='px-4 py-4'>
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault()
                  item.onClick()
                } else {
                  onClose()
                }
              }}
              className='flex items-center justify-center py-4 px-6 mb-2 text-center font-light text-lg text-gray-800 hover:bg-orange-400 transition-colors duration-200 rounded'
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

export default MenuSidebar