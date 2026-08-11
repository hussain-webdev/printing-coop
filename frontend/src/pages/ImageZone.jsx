import React, { useState, useEffect, useMemo } from 'react'
import { Loader, Search, ChevronDown, Upload, FolderPlus, Edit2, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'
import ImageCard from '../components/ImageCard'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const ImageZone = () => {
  const { t } = useTranslation()
  const [folders, setFolders] = useState({ Home: [] })
  const [currentFolder, setCurrentFolder] = useState('Home')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [openFilterMenu, setOpenFilterMenu] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameFolderInput, setRenameFolderInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = React.useRef(null)

  const fetchImages = async () => {
    try {
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')

      if (!sellerId || !token) {
        setError(t('cart.pleaseLogin'))
        setLoading(false)
        return
      }

      const response = await fetch(`${BACKEND_URL}/api/image-zone/get-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ wholesaleSellerId: parseInt(sellerId) }),
      })

      const data = await response.json()

      if (data.success) {
        let imageData = data.imageZone?.images || { Home: [] }
        
        // Handle both array format (old) and folder format (new)
        if (Array.isArray(imageData)) {
          imageData = { Home: imageData }
        }

        setFolders(imageData)
        setCurrentFolder('Home')
        setError(null)
      } else {
        setError(data.message || 'Failed to fetch images')
        toast.error(data.message || 'Failed to fetch images')
      }
    } catch (err) {
      console.error('[v0] Error fetching images:', err)
      setError('Connection error. Please check your backend server.')
      toast.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const currentImages = useMemo(() => {
    let result = [...(folders[currentFolder] || [])]

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase()
      result = result.filter((image) => {
        const filename = image.key?.split('/').pop() || ''
        return filename.toLowerCase().includes(query)
      })
    }

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    } else if (sortBy === 'name') {
      result.sort((a, b) => {
        const nameA = a.key?.split('/').pop() || ''
        const nameB = b.key?.split('/').pop() || ''
        return nameA.localeCompare(nameB)
      })
    }

    return result
  }, [folders, currentFolder, searchTerm, sortBy])

  const handleSelectImage = (index) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedImages(newSelected)
  }

  const handleDeleteImage = async (imageKey, folderName) => {
    try {
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')


      const response = await fetch(`${BACKEND_URL}/api/image-zone/delete-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          folderName,
          imageKey,
        }),
      })

      const data = await response.json()

      if (data.success) {
        let imageData = data.imageZone?.images || { Home: [] }

        if (Array.isArray(imageData)) {
          imageData = { Home: imageData }
        }

        setFolders(imageData)
        toast.success('Image deleted successfully')
      } else {
        toast.error(data.message || 'Failed to delete image')
      }
    } catch (err) {
      console.error('[v0] Error deleting image:', err)
      toast.error('Failed to delete image. Please try again.')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')

      if (!sellerId || !token) {
        toast.error(t('cart.pleaseLogin'))
        return
      }

      const formData = new FormData()
      formData.append('wholesaleSellerId', sellerId)
      formData.append('folderName', currentFolder)
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
      }

      const response = await fetch(`${BACKEND_URL}/api/image-zone/add-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        let imageData = data.imageZone?.images || { Home: [] }
        
        // Handle both array format and folder format
        if (Array.isArray(imageData)) {
          imageData = { Home: imageData }
        }

        setFolders(imageData)
        toast.success(`${files.length} image(s) uploaded successfully to ${currentFolder}`)
        
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(data.message || 'Failed to upload images')
      }
    } catch (err) {
      console.error('[v0] Error uploading images:', err)
      toast.error('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty')
      return
    }

    try {
      setIsProcessing(true)
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')

      const response = await fetch(`${BACKEND_URL}/api/image-zone/create-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          folderName: newFolderName.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        let imageData = data.imageZone?.images || { Home: [] }
        
        if (Array.isArray(imageData)) {
          imageData = { Home: imageData }
        }

        setFolders(imageData)
        setNewFolderName('')
        setShowCreateFolderModal(false)
        toast.success(`Folder "${newFolderName}" created successfully`)
      } else {
        toast.error(data.message || 'Failed to create folder')
      }
    } catch (err) {
      console.error('[v0] Error creating folder:', err)
      toast.error('Failed to create folder')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRenameFolder = async () => {
    if (!renameFolderInput.trim()) {
      toast.error('Folder name cannot be empty')
      return
    }

    try {
      setIsProcessing(true)
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')

      const response = await fetch(`${BACKEND_URL}/api/image-zone/rename-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          oldFolderName: currentFolder,
          newFolderName: renameFolderInput.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFolders(data.imageZone?.images || { Home: [] })
        setCurrentFolder(renameFolderInput.trim())
        setRenameFolderInput('')
        setShowRenameFolderModal(false)
        toast.success(`Folder renamed successfully`)
      } else {
        toast.error(data.message || 'Failed to rename folder')
      }
    } catch (err) {
      console.error('[v0] Error renaming folder:', err)
      toast.error('Failed to rename folder')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (currentFolder === 'Home') {
      toast.error('Cannot delete the Home folder')
      return
    }

    if (!window.confirm(`Are you sure you want to delete the "${currentFolder}" folder and all its images?`)) {
      return
    }

    try {
      setIsProcessing(true)
      const sellerId = localStorage.getItem('sellerId')
      const token = localStorage.getItem('sellerToken')

      const response = await fetch(`${BACKEND_URL}/api/image-zone/delete-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wholesaleSellerId: parseInt(sellerId),
          folderName: currentFolder,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setFolders(data.imageZone?.images || { Home: [] })
        setCurrentFolder('Home')
        toast.success(`Folder deleted successfully`)
      } else {
        toast.error(data.message || 'Failed to delete folder')
      }
    } catch (err) {
      console.error('[v0] Error deleting folder:', err)
      toast.error('Failed to delete folder')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div>
      <DashboardNavbar />
      <div className='pt-34 md:pt-30 pb-24'>
        <div className='p-4'>
          <h1 className='pb-4 font-light text-2xl'>Image Zone</h1>

          {/* Toolbar */}
          <div className='flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-gray-200'>
            {/* Folder Dropdown */}
            <select
              value={currentFolder}
              onChange={(e) => {
                setCurrentFolder(e.target.value)
              }}
              className='px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
            >
              {Object.keys(folders).length > 0 ? (
                Object.keys(folders).map((folder) => {
                  return (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  )
                })
              ) : (
                <option value='Home'>Home</option>
              )}
            </select>

            {/* Upload Image Button */}
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className='px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm font-semibold uppercase tracking-wide rounded transition flex items-center gap-2'
            >
              {uploading ? <Loader size={16} className='animate-spin' /> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {/* Create Folder */}
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide rounded transition flex items-center gap-2'
            >
              <FolderPlus size={16} />
              Create Folder
            </button>

            {/* Rename Folder */}
            {currentFolder !== 'Home' && (
              <button
                onClick={() => {
                  setRenameFolderInput(currentFolder)
                  setShowRenameFolderModal(true)
                }}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold uppercase tracking-wide rounded transition flex items-center gap-2'
              >
                <Edit2 size={16} />
                Rename Folder
              </button>
            )}

            {/* Delete Folder */}
            {currentFolder !== 'Home' && (
              <button
                onClick={handleDeleteFolder}
                disabled={isProcessing}
                className='px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm font-semibold uppercase tracking-wide rounded transition flex items-center gap-2'
              >
                <Trash2 size={16} />
                Delete Folder
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
            />

            {/* Search by image name */}
            <div className='relative flex-1 min-w-[200px] max-w-xs'>
              <Search size={16} className='absolute left-3 top-2.5 text-gray-400' />
              <input
                type='text'
                placeholder='Search Images'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400'
              />
            </div>

            {/* Sort by */}
            <div className='relative'>
              <button
                onClick={() => setOpenFilterMenu(openFilterMenu === 'sort' ? null : 'sort')}
                className='flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition'
              >
                Sort: {sortBy === 'date' ? 'Date' : 'Name'}
                <ChevronDown size={14} />
              </button>
              {openFilterMenu === 'sort' && (
                <div className='absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2'>
                  <button
                    onClick={() => {
                      setSortBy('date')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      sortBy === 'date' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('name')
                      setOpenFilterMenu(null)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      sortBy === 'name' ? 'bg-slate-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Name
                  </button>
                </div>
              )}
            </div>

            {/* Reset */}
            {(searchTerm || sortBy !== 'date') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSortBy('date')
                  setOpenFilterMenu(null)
                }}
                className='px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded transition'
              >
                Reset
              </button>
            )}

            {selectedImages.size > 0 && (
              <span className='text-xs text-gray-600 font-medium'>
                {selectedImages.size} items selected
              </span>
            )}
          </div>

          {loading ? (
            <div className='flex justify-center items-center py-16'>
              <Loader size={32} className='animate-spin text-gray-600' />
            </div>
          ) : error ? (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <p className='text-red-700'>{error}</p>
            </div>
          ) : currentImages.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1'>
              {currentImages.map((image, index) => (
                <ImageCard
                  key={index}
                  image={image}
                  index={index}
                  isSelected={selectedImages.has(index)}
                  onSelect={handleSelectImage}
                  onDelete={handleDeleteImage}
                  folderName={currentFolder}
                />
              ))}
            </div>
          ) : (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-6'>
              <p className='text-gray-700'>No images in this folder. Upload your first image to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className='fixed inset-0 bg-[#0000006f] flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 shadow-lg'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Create New Folder</h2>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <X size={20} />
              </button>
            </div>
            <input
              type='text'
              placeholder='Folder name'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              className='w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className='px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={isProcessing}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded'
              >
                {isProcessing ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolderModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 shadow-lg'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Rename Folder</h2>
              <button
                onClick={() => setShowRenameFolderModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <X size={20} />
              </button>
            </div>
            <input
              type='text'
              placeholder='New folder name'
              value={renameFolderInput}
              onChange={(e) => setRenameFolderInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder()}
              className='w-full px-3 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowRenameFolderModal(false)}
                className='px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded'
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                disabled={isProcessing}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded'
              >
                {isProcessing ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ImageZone