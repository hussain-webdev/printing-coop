import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, ShoppingBasket, ShoppingCart } from 'lucide-react';
import MenuSidebar from './MenuSidebar';

const DashboardNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (route) => location.pathname === route

  const categories = [
    { route: '/dashboard-banner', icon: '/banner-icon.svg', label: 'BANNER' },
    { route: '/dashboard-rigid', icon: '/rigid-icon.svg', label: 'RIGID' },
    { route: '/dashboard-adhesive', icon: '/adhesive-icon.svg', label: 'ADHESIVE' },
    { route: '/dashboard-magnet', icon: '/magnet-icon.svg', label: 'MAGNETS' },
    { route: '/dashboard-apparel', icon: '/apparel-icon.svg', label: 'APPAREL' },
    { route: '/dashboard-flag', icon: '/flag-icon.svg', label: 'FLAG & FABRIC' },
    { route: '/dashboard-misc', icon: '/misc-icon.svg', label: 'MISC & PRINTS' },
  ]

  return (
    <>
    <div className='fixed w-full z-40'>
        {/* Top Navy Bar */}
        <div className='bg-[#0f2761] h-8 w-full' />

        {/* Desktop Navigation */}
        <div className='hidden md:flex bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2)] px-6 py-3 justify-between items-center'>
            <img className='h-10' src="/printing_coopLogo2.png" alt="" />

            <div className='w-px h-14 bg-gray-200 mx-2' />

            <div className='flex gap-4 items-center'>
                {categories.map((cat) => (
                  <div key={cat.route} className='flex flex-col items-center cursor-pointer group' onClick={() => navigate(cat.route)}>
                    <div className={`p-2 rounded ${isActive(cat.route) ? 'bg-[#ffbb0f]' : ''}`}>
                      <img src={cat.icon} alt={cat.label} className='w-[30px] h-[30px] object-contain' />
                    </div>
                    <p className='text-[11px] pt-1 font-medium text-gray-600 text-center leading-tight whitespace-nowrap'>{cat.label}</p>
                  </div>
                ))}
            </div>

            <div className='flex gap-5 items-center'>
                <button
                  onClick={() => navigate('/product-listing')}
                  className='flex items-center gap-2 bg-[#0b1f4d] hover:bg-[#0e2a63] transition-colors text-white px-5 py-2.5 rounded-md'
                >
                    <ShoppingBasket size={20} strokeWidth={1.5} />
                    <span className='text-sm font-semibold tracking-wide'>PRODUCT LISTING</span>
                </button>

                <div className='w-px h-10 bg-gray-200' />

                <img className='w-8 h-6 object-cover rounded-sm' src="/us.svg" alt="" />

                <Link to={'/cart'}>
                  <ShoppingCart size={26} strokeWidth={1.3} color='#3d3d3d' className='cursor-pointer' />
                </Link>

                <Menu size={26} strokeWidth={1.3} color='#3d3d3d' className='cursor-pointer' onClick={() => setIsMenuOpen(true)} />
            </div>
        </div>

        {/* Mobile/Tablet Header */}
        <div className='md:hidden bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2)] p-2 flex justify-between items-center'>
            <img className='h-8' src="/printing_coopLogo2.png" alt="" />
            <div className='flex items-center gap-4'>
                <img className='w-6 h-4 object-cover rounded-sm' src="/us.svg" alt="" />
                <Link to={'/cart'}>
                  <ShoppingCart size={24} strokeWidth={1.3} color='#3d3d3d' />
                </Link>
                <Menu size={26} strokeWidth={1.2} color='#3d3d3d' className='cursor-pointer' onClick={() => setIsMenuOpen(true)} />
            </div>
        </div>

        {/* Horizontal Scrollable Icons - Mobile/Tablet */}
        <div className='md:hidden bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)] overflow-x-auto'>
          <div className='flex justify-center gap-2 p-2 min-w-min'>
            {categories.map((cat) => (
              <div key={cat.route} className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate(cat.route)}>
                <div className={`p-1 rounded ${isActive(cat.route) ? 'bg-[#ffbb0f]' : ''}`}>
                  <img src={cat.icon} alt={cat.label} className='w-6 h-6 object-contain' />
                </div>
                <p className='text-[9px] pt-0.5 font-medium text-gray-600 whitespace-nowrap'>{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
    </div>
    <MenuSidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

export default DashboardNavbar