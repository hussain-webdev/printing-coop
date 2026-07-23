import React from 'react'
import { useTranslation } from 'react-i18next'

const Footer = () => {
  const { t } = useTranslation()
  
  return (
    <div className='fixed bottom-0 left-0 right-0 w-full bg-white p-5 flex-wrap flex items-center gap-5 z-40'>
      <div className='bg-[#ffbb0f] cursor-pointer px-3 py-1.5 rounded '>
        {t('footer.feedback')}
      </div>
      <ul className='text-sm font-light flex-wrap flex gap-5 items-center'>
        <li>{t('footer.copyright')}</li>
        <li>{t('footer.termsAndConditions')}</li>
        <li>{t('footer.phone')}</li>
        <li>{t('footer.customerServiceHours')}</li>
      </ul>
    </div>
  )
}

export default Footer
