import React from 'react'

const Footer = () => {
  return (
    <div className='fixed bottom-0 left-0 right-0 w-full bg-white p-5 flex-wrap flex items-center gap-5 z-40'>
      <div className='bg-[#ffbb0f] cursor-pointer px-3 py-1.5 rounded '>
        COMMENT NOUS EN SOMMES-NOUS ?
      </div>
      <ul className='text-sm font-light flex-wrap flex gap-5 items-center'>
        <li>Copyright © 2026</li>
        <li>Terms & Conditions</li>
        <li>(800) 000-0000</li>
        <li>Horaires du service client</li>
      </ul>
    </div>
  )
}

export default Footer
