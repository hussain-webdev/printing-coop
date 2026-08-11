import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageCard = ({ image, index, isSelected, onSelect, onDelete, folderName }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null);

  // Parse image data
  const imageUrl = image.url || '';
  const imageKey = image.key || '';
  const uploadedAt = image.uploadedAt ? new Date(image.uploadedAt) : new Date();

  // Extract filename from S3 key
  const filename = imageKey.split('/').pop() || 'image';

  // Actual pixel dimensions, read from the loaded image itself
  const dimensions = naturalSize ? `${naturalSize.width} x ${naturalSize.height}px` : '...';

  // Format date
  const formattedDate = uploadedAt.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const formattedTime = uploadedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleImageLoad = (e) => {
    setNaturalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(imageKey, folderName);
    } catch (error) {
      console.error('[v0] Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex items-start gap-3 pl-2 bg-white shadow-[5px_4px_5px_rgba(0,0,0,0.16)]">
      {/* Image tile - plain, no border */}
      <div className="w-32 h-28 shrink-0 bg-white flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={filename}
          onLoad={handleImageLoad}
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>

      {/* Details - left aligned */}
      <div className="text-xs text-gray-600 leading-relaxed pt-0.5 text-left flex-1">
        <h3 className="text-sm font-medium text-gray-900 mb-1 break-all">
          {filename}
        </h3>
        <p>{dimensions}</p>
        <p className="text-gray-500 mt-1">
          {formattedDate}, {formattedTime}
        </p>
      </div>

      {/* Delete icon - fixed to bottom right corner of the card */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute bottom-2 right-2 w-5 h-5 flex items-center justify-center bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-400 transition-colors shrink-0"
      >
        <X strokeWidth={5} size={12} />
      </button>
    </div>
  );
};

export default ImageCard;