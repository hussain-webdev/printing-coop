import React, { useState } from 'react'
import { Menu, X, ShoppingBasket, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className='w-full'>
      {/* Desktop Navbar */}
      <div className='hidden md:flex justify-between items-center w-full p-6'>
        <div>
          <Link to={'/'}><img className='w-48' src="/printing_coopLogo2.png" alt="Logo" /></Link>
        </div>
        <ul className='flex gap-8 text-sm font-medium'>
          <li className='hover:text-orange-500 transition cursor-pointer'>HOME</li>
          <li className='hover:text-orange-500 transition cursor-pointer'>PRODUCTS</li>
          <li className='hover:text-orange-500 transition cursor-pointer'><Link to={'/register-wholesale-seller'}>WHOLESALE PARTNER</Link></li>
          <li className='hover:text-orange-500 transition cursor-pointer'>CONTACT US</li>
        </ul>
        <div className='flex gap-4 items-center'>
          {/* <ShoppingBasket strokeWidth="1.5" className='cursor-pointer hover:text-orange-500 transition' /> */}
          <Link to={'/login-user'}><UserRound strokeWidth="1.5" className='cursor-pointer hover:text-orange-500 transition' /></Link>
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className='md:hidden flex justify-between items-center w-full p-4'>
        <div>
          <Link to={'/'}><img className='w-40' src="/printing_coopLogo2.png" alt="Logo" /></Link>
        </div>
        <div className='flex gap-4 items-center'>
          <ShoppingBasket strokeWidth="1.5" className='cursor-pointer' />
          <Link to={'/login-user'}><UserRound strokeWidth="1.5" className='cursor-pointer' /></Link>
          <button onClick={toggleMenu} className='focus:outline-none'>
            {isMenuOpen ? (
              <X strokeWidth="1.5" size={24} />
            ) : (
              <Menu strokeWidth="1.5" size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className='md:hidden bg-slate-50 border-t border-gray-200'>
          <ul className='flex flex-col gap-4 p-6 text-sm font-medium'>
            <li onClick={closeMenu} className='hover:text-orange-500 transition cursor-pointer'>HOME</li>
            <li onClick={closeMenu} className='hover:text-orange-500 transition cursor-pointer'>PRODUCTS</li>
            <li onClick={closeMenu} className='hover:text-orange-500 transition cursor-pointer'><Link to={'/register-wholesale-seller'}>WHOLESALE PARTNER</Link></li>
            <li onClick={closeMenu} className='hover:text-orange-500 transition cursor-pointer'>CONTACT US</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default Navbar
