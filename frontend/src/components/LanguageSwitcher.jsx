import React from 'react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className='w-fit flex items-center border border-gray-300 rounded-full overflow-hidden text-xs font-semibold'>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 transition ${
          i18n.language === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-3 py-1.5 transition ${
          i18n.language === 'fr' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        FR
      </button>
    </div>
  )
}

export default LanguageSwitcher