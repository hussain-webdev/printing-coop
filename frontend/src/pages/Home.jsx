import React, { useState } from 'react'
import SellerLoginSidebar from '../components/SellerLoginSidebar'
import SellerForgotPasswordSidebar from '../components/SellerForgotPasswordSidebar'
import SellerApplySidebar from '../components/SellerApplySidebar'

const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [isApplyOpen, setIsApplyOpen] = useState(false)

  const openForgotPassword = () => {
    setIsLoginOpen(false)
    setIsForgotPasswordOpen(true)
  }

  const returnToLogin = () => {
    setIsForgotPasswordOpen(false)
    setIsLoginOpen(true)
  }

  return (
    <div className='relative h-screen overflow-hidden'>
      {/* Background Video */}
      <video 
        className='fixed inset-0 w-full h-full object-cover -z-10'
        autoPlay
        loop
        muted
      >
        <source src="/herovid1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Fixed Navbar */}
      <div className='fixed top-0 left-0 right-0 z-10 p-8'>
        <div className='flex flex-wrap gap-6 justify-between items-center'>
          <img className='w-60 pl-4' src="/printing_coopLogo2.png" alt="" />
          <div className='flex items-center gap-3 px-6'>
            <button 
              onClick={() => setIsLoginOpen(true)}
              className='text-xl bg-[#00000080] text-white py-2 px-8 font-light border-white border-3 '
            >
              LOGIN
            </button>
            <button 
              onClick={() => setIsApplyOpen(true)}
              className='text-xl bg-[#00000080] text-white py-2 px-8 font-light border-white border-3 '
            >
              APPLY
            </button>
          </div>
        </div>
      </div>

      <div className='bg-white'>

      </div>

      {/* Fixed Bottom Elements */}
      <div className='fixed bottom-0 left-0 right-0 z-10 py-8 px-12 flex justify-between items-center pointer-events-none'>
        <div className='text-white font-semibold text-2xl'>Version 0.0.1</div>
        <div className='text-gray-300 font-semibold text-3xl'>1-800-000-0000</div>
      </div>

      {/* Sidebars */}
      <SellerLoginSidebar 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onForgotPasswordClick={openForgotPassword}
      />
      <SellerForgotPasswordSidebar 
        isOpen={isForgotPasswordOpen} 
        onClose={() => setIsForgotPasswordOpen(false)}
        onReturnToLogin={returnToLogin}
      />
      <SellerApplySidebar 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)}
      />
    </div>
  )
}

export default Home
