import React from 'react'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const DashboardHandheld = () => {
  return (
    <div>
      <DashboardNavbar />
      <div className='pt-38 md:pt-34 pb-24'>
        
        <img src="/handheldheroimg.png" alt="" />
        <div className='p-4'>
            <h1 className='pb-4 font-light text-2xl'>Produits HandHelds</h1>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
                <div className='h-58 bg-[#ffbb0f] rounded-lg hover:shadow-lg transition'></div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardHandheld
