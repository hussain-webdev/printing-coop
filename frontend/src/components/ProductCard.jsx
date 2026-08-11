import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Pulls the current language's value out of a { en, fr } field. Falls back to
// English, then to a plain string/array if the field isn't localized at all
// (keeps this working for any older product data saved before translations
// were added), then to the given fallback.
const getLocalizedField = (field, language, fallback) => {
  if (field === null || field === undefined) return fallback
  if (typeof field === 'object' && !Array.isArray(field)) {
    return field[language] ?? field.en ?? fallback
  }
  return field
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const language = i18n.language === 'fr' ? 'fr' : 'en'
  const [isHovered, setIsHovered] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Get the first image from the images array
  const backgroundImage = product?.images?.[0]?.url || '/placeholder.svg?height=300&width=400'
  const logoImage = product?.logo || '/placeholder.svg?height=60&width=60'
  const materials = getLocalizedField(product?.materials, language, 'Materials not available')
  const productName = getLocalizedField(product?.name, language, 'Product Name')
  const description = getLocalizedField(product?.description, language, 'Product description not available')
  const commonUses = getLocalizedField(product?.commonUses, language, [])
  const options = getLocalizedField(product?.options, language, [])
  const environment = getLocalizedField(product?.environment, language, [])

  // Product "name" is localized now, so type checks (e.g. is this the DTF
  // product) need the raw English value rather than the display string
  const productNameEn = typeof product?.name === 'object' ? product?.name?.en : product?.name
  const isDTF = productNameEn === 'DTF'

  return (
    <div
      className='relative h-64 rounded-lg overflow-hidden bg-gray-200 shadow-lg'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center',
        }}
      />

      {/* White Overlay - full height by default, collapses to bottom half on hover */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-white/90 transition-all duration-500 ease-in-out overflow-hidden ${
          isHovered ? 'top-1/2' : 'top-0'
        }`}
      >
        {/* Default view: logo, name, underline - fades out on hover */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 transition-opacity duration-300 ease-in-out ${
            isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <img src={logoImage} alt='logo' className='w-56 object-contain' />
          {/* <div className='text-center'>
            <h3 className='font-bold text-base text-gray-900 tracking-wide text-balance'>
              {productName.toUpperCase()}
            </h3>
            <div className='w-16 h-0.5 bg-orange-500 mx-auto mt-2' />
          </div> */}
        </div>

        {/* Hover view: name, material, buttons - fades in on hover */}
        <div
          className={`absolute inset-0 flex flex-col justify-center gap-2 p-4 transition-opacity duration-300 ease-in-out delay-100 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <h3 className='font-bold text-lg text-blue-900 uppercase tracking-wide'>{productName}</h3>
          <p className='text-xs text-gray-700 line-clamp-2'>{materials}</p>
          <div className='flex gap-2 pt-2'>
            <button
              onClick={() => setShowModal(true)}
              className='px-3 py-1.5 border-2 border-gray-900 text-gray-900 text-xs font-semibold rounded-md hover:bg-gray-100 transition-colors duration-200'
            >
              MORE INFO
            </button>
            <button
              onClick={() => {
                const route = isDTF ? `/order/dtf/${product.id}` : `/order/${product.category}/${product.id}`
                navigate(route)
              }}
              className='px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-orange-600 transition-colors duration-200'
            >
              ORDER
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-yellow-400 rounded-lg w-full h-[80vh] max-w-6xl overflow-y-auto flex flex-col relative'>
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className='absolute top-6 right-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition'
            >
              <X size={20} className='text-gray-900' strokeWidth={3} />
            </button>

            {/* Top Section - Left side content and right side details */}
            <div className='flex flex-col lg:flex-row gap-8 p-8 flex-1'>
              {/* Left Side - Content */}
              <div className='lg:w-1/2 flex flex-col gap-6'>
                {/* Logo */}
                <div className='flex justify-start'>
                  <img
                    src={logoImage}
                    alt='logo'
                    className='w-24 h-24 object-contain object-left'
                  />
                </div>

                {/* Product Name */}
                <h1 className='text-4xl font-bold text-gray-900'>
                  {productName.toUpperCase()}
                </h1>

                {/* Description */}
                <div>
                  <p className='text-gray-900 text-base leading-relaxed'>
                    {description}
                  </p>
                </div>

                {/* Buttons */}
                <div className='flex gap-4 pt-4'>
                  <button className='px-6 py-2.5 border-2 border-gray-900 text-gray-900 font-semibold rounded-full hover:bg-yellow-300 transition'>
                    VIEW SPEC SHEET
                  </button>
                  <button
                    onClick={() => {
                      const route = isDTF ? `/order/dtf/${product.id}` : `/order/${product.category}/${product.id}`
                      navigate(route)
                    }}
                    className='px-6 py-2.5 border-2 border-gray-900 text-gray-900 font-semibold rounded-full hover:bg-yellow-300 transition'
                  >
                    ORDER
                  </button>
                </div>
              </div>

              {/* Right Side - Common Uses, Options, Environment */}
              <div className='lg:w-1/2'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8'>
                  {/* Common Uses */}
                  {commonUses && commonUses.length > 0 && (
                    <div>
                      <h3 className='text-xl font-bold text-gray-900 mb-3'>COMMON USES</h3>
                      <ul className='space-y-2'>
                        {commonUses.map((use, index) => (
                          <li key={index} className='text-amber-900 flex items-start gap-2'>
                            <span className='text-amber-900 mt-1'>•</span>
                            <span>{use}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Options */}
                  {options && options.length > 0 && (
                    <div>
                      <h3 className='text-xl font-bold text-gray-900 mb-3'>{isDTF ? 'INSTRUCTIONS' : 'OPTIONS'}</h3>
                      <ul className='space-y-2'>
                        {options.map((opt, index) => (
                          <li key={index} className='text-amber-900 flex items-start gap-2'>
                            <span className='text-amber-900 mt-1'>•</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Environment */}
                  {environment && environment.length > 0 && (
                    <div>
                      <h3 className='text-xl font-bold text-gray-900 mb-3'>{isDTF ? 'COMMON ITEMS' : 'ENVIRONMENT'}</h3>
                      <ul className='space-y-2'>
                        {environment.map((env, index) => (
                          <li key={index} className='text-amber-900 flex items-start gap-2'>
                            <span className='text-amber-900 mt-1'>•</span>
                            <span>{env}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section - Additional Images */}
            {product?.images && product.images.length > 1 && (
              <div className='bg-white px-8 py-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {product.images.slice(1).map((image, index) => (
                    <div
                      key={index}
                      className='rounded-lg overflow-hidden h-48'
                    >
                      <img
                        src={image.url}
                        alt={`Product image ${index + 2}`}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductCard