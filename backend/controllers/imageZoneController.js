import { getRedisClient } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { uploadToS3 } from '../config/s3.js';
import fs from 'fs';

// Get all images for a specific wholesale seller
const getSellerImages = async (req, res) => {
  try {
    const { wholesaleSellerId } = req.body;

    // Validate required fields
    if (!wholesaleSellerId) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId is required',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Get or create ImageZone for the seller
    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      imageZone = await prisma.imageZone.create({
        data: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          images: { Home: [] },
        },
      });
    }

    res.json({
      success: true,
      message: 'Images retrieved successfully',
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        companyName: seller.companyName,
      },
      imageZone,
      totalImages: imageZone.images ? imageZone.images.length : 0,
    });
  } catch (error) {
    console.log('[v0] Error getting seller images:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Add images to seller's ImageZone in a specific folder
const addImagesToZone = async (req, res) => {
  try {
    const { wholesaleSellerId, folderName = 'Home' } = req.body;

    // Validate required fields
    if (!wholesaleSellerId) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId is required',
      });
    }

    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.json({
        success: false,
        message: 'No images provided',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    // Upload images to S3
    const uploadedImages = [];
    for (const file of req.files) {
      try {
        const s3Key = `printing-coop/image-zone/${file.originalname}`;
        const s3Result = await uploadToS3(file.path, s3Key, file.mimetype);
        
        uploadedImages.push({
          url: s3Result.url,
          key: s3Result.key,
          uploadedAt: new Date(),
        });

        // Delete the temporary file
        fs.unlink(file.path, (err) => {
          if (err) console.log('[v0] Error deleting temp file:', err);
        });
      } catch (uploadError) {
        // Clean up temp file on error
        fs.unlink(file.path, (err) => {
          if (err) console.log('[v0] Error deleting temp file:', err);
        });
        
        throw uploadError;
      }
    }

    // Get or create ImageZone for the seller
    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      // Create new ImageZone with Home folder
      console.log('[v0] Creating new ImageZone with folder:', folderName);
      const folderStructure = {};
      folderStructure[folderName] = uploadedImages;
      console.log('[v0] Folder structure to create:', JSON.stringify(folderStructure));
      
      imageZone = await prisma.imageZone.create({
        data: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          images: folderStructure,
        },
      });
      console.log('[v0] Returned from Prisma create');
      console.log('[v0] imageZone.images type:', typeof imageZone.images);
      console.log('[v0] imageZone.images value:', JSON.stringify(imageZone.images));
      console.log('[v0] Created ImageZone with structure:', imageZone.images);
    } else {
      // Update existing ImageZone - add images to specified folder
      const folders = imageZone.images && typeof imageZone.images === 'object' ? imageZone.images : { Home: [] };
      
      if (!folders[folderName]) {
        folders[folderName] = [];
      }
      
      folders[folderName] = [...(folders[folderName] || []), ...uploadedImages];
      console.log('[v0] Updated folder structure:', folders);

      console.log('[v0] About to update with data:', JSON.stringify(folders));
      imageZone = await prisma.imageZone.update({
        where: { id: imageZone.id },
        data: {
          images: folders,
        },
      });
      console.log('[v0] Returned from Prisma update');
      console.log('[v0] imageZone.images type:', typeof imageZone.images);
      console.log('[v0] imageZone.images value:', JSON.stringify(imageZone.images));
      console.log('[v0] Updated ImageZone with structure:', imageZone.images);
    }

    // Invalidate cache
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`image-zone:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) added to ${folderName} successfully`,
      imageZone,
      uploadedImages,
    });
  } catch (error) {
    console.log('[v0] Error adding images to zone:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new folder
const createFolder = async (req, res) => {
  try {
    const { wholesaleSellerId, folderName } = req.body;

    if (!wholesaleSellerId || !folderName) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId and folderName are required',
      });
    }

    // Check if wholesaleSeller exists
    const seller = await prisma.wholesaleSeller.findUnique({
      where: { id: parseInt(wholesaleSellerId) },
    });

    if (!seller) {
      return res.json({
        success: false,
        message: 'Wholesale seller not found',
      });
    }

    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      console.log('[v0] Creating new ImageZone with folder:', folderName);
      const folderStructure = {
        Home: [],
      };
      folderStructure[folderName] = [];
      
      imageZone = await prisma.imageZone.create({
        data: {
          wholesaleSellerId: parseInt(wholesaleSellerId),
          images: folderStructure,
        },
      });
      console.log('[v0] Created ImageZone with folders:', Object.keys(imageZone.images));
    } else {
      const folders = imageZone.images && typeof imageZone.images === 'object' ? imageZone.images : { Home: [] };
      
      if (folders[folderName]) {
        return res.json({
          success: false,
          message: `Folder "${folderName}" already exists`,
        });
      }
      
      folders[folderName] = [];
      console.log('[v0] Added folder, new structure:', Object.keys(folders));

      imageZone = await prisma.imageZone.update({
        where: { id: imageZone.id },
        data: {
          images: folders,
        },
      });
      console.log('[v0] Updated ImageZone with folders:', Object.keys(imageZone.images));
    }

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`image-zone:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: `Folder "${folderName}" created successfully`,
      imageZone,
    });
  } catch (error) {
    console.log('[v0] Error creating folder:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Rename a folder
const renameFolder = async (req, res) => {
  try {
    const { wholesaleSellerId, oldFolderName, newFolderName } = req.body;

    if (!wholesaleSellerId || !oldFolderName || !newFolderName) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, oldFolderName, and newFolderName are required',
      });
    }

    if (oldFolderName === 'Home') {
      return res.json({
        success: false,
        message: 'Cannot rename the Home folder',
      });
    }

    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      return res.json({
        success: false,
        message: 'ImageZone not found',
      });
    }

    const folders = imageZone.images || { Home: [] };

    if (!folders[oldFolderName]) {
      return res.json({
        success: false,
        message: `Folder "${oldFolderName}" not found`,
      });
    }

    if (folders[newFolderName]) {
      return res.json({
        success: false,
        message: `Folder "${newFolderName}" already exists`,
      });
    }

    folders[newFolderName] = folders[oldFolderName];
    delete folders[oldFolderName];

    imageZone = await prisma.imageZone.update({
      where: { id: imageZone.id },
      data: {
        images: folders,
      },
    });

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`image-zone:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: `Folder renamed from "${oldFolderName}" to "${newFolderName}" successfully`,
      imageZone,
    });
  } catch (error) {
    console.log('[v0] Error renaming folder:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a folder
const deleteFolder = async (req, res) => {
  try {
    const { wholesaleSellerId, folderName } = req.body;

    if (!wholesaleSellerId || !folderName) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId and folderName are required',
      });
    }

    if (folderName === 'Home') {
      return res.json({
        success: false,
        message: 'Cannot delete the Home folder',
      });
    }

    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      return res.json({
        success: false,
        message: 'ImageZone not found',
      });
    }

    const folders = imageZone.images || { Home: [] };

    if (!folders[folderName]) {
      return res.json({
        success: false,
        message: `Folder "${folderName}" not found`,
      });
    }

    delete folders[folderName];

    imageZone = await prisma.imageZone.update({
      where: { id: imageZone.id },
      data: {
        images: folders,
      },
    });

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`image-zone:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: `Folder "${folderName}" deleted successfully`,
      imageZone,
    });
  } catch (error) {
    console.log('[v0] Error deleting folder:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a specific image
const deleteImage = async (req, res) => {
  try {
    const { wholesaleSellerId, folderName, imageKey } = req.body;

    if (!wholesaleSellerId || !folderName || !imageKey) {
      return res.json({
        success: false,
        message: 'wholesaleSellerId, folderName, and imageKey are required',
      });
    }

    let imageZone = await prisma.imageZone.findUnique({
      where: { wholesaleSellerId: parseInt(wholesaleSellerId) },
    });

    if (!imageZone) {
      return res.json({
        success: false,
        message: 'ImageZone not found',
      });
    }

    const folders = imageZone.images || { Home: [] };

    if (!folders[folderName]) {
      return res.json({
        success: false,
        message: `Folder "${folderName}" not found`,
      });
    }

    // Find and remove the image
    const initialLength = folders[folderName].length;
    folders[folderName] = folders[folderName].filter((img) => img.key !== imageKey);

    if (folders[folderName].length === initialLength) {
      return res.json({
        success: false,
        message: 'Image not found in this folder',
      });
    }

    imageZone = await prisma.imageZone.update({
      where: { id: imageZone.id },
      data: {
        images: folders,
      },
    });

    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.del(`image-zone:${wholesaleSellerId}`);
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      imageZone,
    });
  } catch (error) {
    console.log('[v0] Error deleting image:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { getSellerImages, addImagesToZone, createFolder, renameFolder, deleteFolder, deleteImage };
