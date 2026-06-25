import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GiTShirt } from "react-icons/gi";
import { Bookmark, Camera, FileText, Grid2X2, Images, Magnet, Menu, Monitor, Shirt, ShoppingBasket } from 'lucide-react';

const DashboardNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (route) => location.pathname === route

  return (
    <div className='fixed w-full z-40'>
        {/* Orange Banner */}
        <div className='bg-[#ffbb0f] flex items-center gap-3 md:gap-12 justify-center h-10 md:h-14 w-full px-2'>
          <GiTShirt size={24} className='md:w-9 md:h-9' />
          <p className='font-bold text-[11px] md:text-xl text-center'>L'impression de t-shirts personnalisés en couleur est désormais disponible.</p>
          <GiTShirt size={24} className='md:w-9 md:h-9' />
        </div>

        {/* Desktop Navigation */}
        <div className='hidden md:flex bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2)] p-2 justify-between items-center'>
            <img className='h-10' src="/printing_coopLogo2.png" alt="" />
            <div className='flex gap-7 items-center'>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-banner')}>
                    <div className={`p-1.5 ${isActive('/dashboard-banner') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Bookmark size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>BANNIÈRE</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-rigid')}>
                    <div className={`p-1.5 ${isActive('/dashboard-rigid') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Monitor size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>RIGIDE</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-adhesive')}>
                    <div className={`p-1.5 ${isActive('/dashboard-adhesive') ? 'bg-[#ffbb0f]' : ''}`}>
                        <FileText size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>ADHÉSIVE</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-handheld')}>
                    <div className={`p-1.5 ${isActive('/dashboard-handheld') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Images size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>HANDHELD</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-magnet')}>
                    <div className={`p-1.5 ${isActive('/dashboard-magnet') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Magnet size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>AIMANT</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-apparel')}>
                    <div className={`p-1.5 ${isActive('/dashboard-apparel') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Shirt size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>VÊTEMENTS</p>
                </div>
                <div className='flex flex-col items-center cursor-pointer' onClick={() => navigate('/dashboard-misc')}>
                    <div className={`p-1.5 ${isActive('/dashboard-misc') ? 'bg-[#ffbb0f]' : ''}`}>
                        <Grid2X2 size={36} strokeWidth={1.2} color='#6b6b6b' />
                    </div>
                    <p className='text-xs pt-1 font-extralight'>MISC</p>
                </div>
            </div>
            <div className='flex gap-7 items-center'>
                <div className='flex flex-col items-center'>
                    <img className='size-12' src="/us.svg" alt="" />
                    <p className='text-xs pt-1 font-extralight'>DEVISE</p>
                </div>
                <div className='flex flex-col items-center'>
                    <div className='p-1.5'><Camera size={36} strokeWidth={1.2} color='#6b6b6b' /></div>
                    <p className='text-xs pt-1 font-extralight'>ZONE D'IMAGE</p>
                </div>
                <div className='flex flex-col items-center'>
                    <div className='p-1.5'><ShoppingBasket size={36} strokeWidth={1.2} color='#6b6b6b' /></div>
                    <p className='text-xs pt-1 font-extralight'>PANIER</p>
                </div>
                <div className='flex flex-col items-center'>
                    <div className='p-1.5'><Menu size={36} strokeWidth={1.2} color='#6b6b6b' /></div>
                    <p className='text-xs pt-1 font-extralight'>MENU</p>
                </div>
            </div>
        </div>

        {/* Mobile/Tablet Header */}
        <div className='md:hidden bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.2)] p-2 flex justify-between items-center'>
            <img className='h-8' src="/printing_coopLogo2.png" alt="" />
            <Menu size={28} className='cursor-pointer' />
        </div>

        {/* Horizontal Scrollable Icons - Mobile/Tablet */}
        <div className='md:hidden bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)] overflow-x-auto'>
          <div className='flex justify-center gap-3 p-2 min-w-min'>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-banner')}>
              <div className={`p-1 ${isActive('/dashboard-banner') ? 'bg-[#ffbb0f]' : ''}`}>
                <Bookmark size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>BANNIÈRE</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-rigid')}>
              <div className={`p-1 ${isActive('/dashboard-rigid') ? 'bg-[#ffbb0f]' : ''}`}>
                <Monitor size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>RIGIDE</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-adhesive')}>
              <div className={`p-1 ${isActive('/dashboard-adhesive') ? 'bg-[#ffbb0f]' : ''}`}>
                <FileText size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>ADHÉSIVE</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-handheld')}>
              <div className={`p-1 ${isActive('/dashboard-handheld') ? 'bg-[#ffbb0f]' : ''}`}>
                <Images size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>HANDHELD</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-magnet')}>
              <div className={`p-1 ${isActive('/dashboard-magnet') ? 'bg-[#ffbb0f]' : ''}`}>
                <Magnet size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>AIMANT</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-apparel')}>
              <div className={`p-1 ${isActive('/dashboard-apparel') ? 'bg-[#ffbb0f]' : ''}`}>
                <Shirt size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>VÊTEMENTS</p>
            </div>
            <div className='flex flex-col items-center cursor-pointer shrink-0' onClick={() => navigate('/dashboard-misc')}>
              <div className={`p-1 ${isActive('/dashboard-misc') ? 'bg-[#ffbb0f]' : ''}`}>
                <Grid2X2 size={26} strokeWidth={1.2} color='#6b6b6b' />
              </div>
              <p className='text-[10px] pt-0.5 font-extralight whitespace-nowrap'>MISC</p>
            </div>
          </div>
        </div>
    </div>
  )
}

export default DashboardNavbar
