import { getRedisClient } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Helper function to parse JSON safely
const parseJSON = (value) => {
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch (e) {
    return null;
  }
};

// Add a new product with image and logo upload
const addProduct = async (req, res) => {
  try {
    const { name, basePrice, category, description, materials, finishConfig, commonUses, options, environment } = req.body;

    // Validate required fields
    if (!name || !basePrice || !category || !finishConfig) {
      return res.json({ 
        success: false, 
        message: 'All fields (name, basePrice, category, finishConfig) are required' 
      });
    }

    // Validate and parse numeric basePrice
    const parsedBasePrice = Number(basePrice);
    if (Number.isNaN(parsedBasePrice) || parsedBasePrice <= 0) {
      return res.json({ 
        success: false, 
        message: 'basePrice must be a positive number' 
      });
    }

    // Validate and parse finishConfig
    const parsedFinishConfig = parseJSON(finishConfig);
    if (!parsedFinishConfig || typeof parsedFinishConfig !== 'object') {
      return res.json({ 
        success: false, 
        message: 'finishConfig must be a valid JSON object' 
      });
    }

    // Parse optional JSON fields
    const parsedCommonUses = parseJSON(commonUses);
    const parsedOptions = parseJSON(options);
    const parsedEnvironment = parseJSON(environment);

    // Handle product images upload
    const imageUrls = [];
    let logoUrl = null;

    // upload.fields() puts files into req.files as an object keyed by
    // field name (e.g. { images: [...], logo: [...] }), NOT a flat array.
    const uploadedImages = req.files?.images || [];
    const uploadedLogo = req.files?.logo || [];
    const allFiles = [...uploadedImages, ...uploadedLogo];

    if (allFiles.length > 0) {
      for (const file of allFiles) {
        try {
          console.log('[v0] Uploading file to Cloudinary:', file.originalname);
          
          // Determine folder based on filename - if it contains 'logo', upload to logo folder
          const isLogo = file.fieldname === 'logo';
          const folder = isLogo ? 'printing-coop/products/logos' : 'printing-coop/products';

          const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
          });

          if (isLogo) {
            logoUrl = result.secure_url;
          } else {
            imageUrls.push({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }

          // Delete the temporary file
          fs.unlink(file.path, (err) => {
            if (err) console.log('[v0] Error deleting temp file:', err);
          });

          console.log('[v0] File uploaded successfully:', result.secure_url);
        } catch (uploadError) {
          console.log('[v0] Error uploading file to Cloudinary:', uploadError);
          fs.unlink(file.path, (err) => {
            if (err) console.log('[v0] Error deleting temp file:', err);
          });
          
          return res.json({
            success: false,
            message: `Error uploading file ${file.originalname}: ${uploadError.message}`,
          });
        }
      }
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        basePrice: parsedBasePrice,
        category,
        description: description || null,
        materials: materials || null,
        logo: logoUrl,
        finishConfig: parsedFinishConfig,
        images: imageUrls.length > 0 ? imageUrls : [],
        commonUses: parsedCommonUses,
        options: parsedOptions,
        environment: parsedEnvironment,
      },
    });

    // Cache product in Redis
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.setEx(`product:${product.id}`, 3600, JSON.stringify(product));
    }

    res.json({ 
      success: true, 
      message: 'Product added successfully',
      product,
      filesUploaded: {
        images: imageUrls.length,
        logo: logoUrl ? 1 : 0,
      },
    });
  } catch (error) {
    console.log('[v0] Error adding product:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Try to get from cache first
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.setEx('products:all', 3600, JSON.stringify(products));
    }

    res.json({
      success: true,
      message: 'All products retrieved successfully',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.log('[v0] Error getting all products:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get single product details
const getProductDetails = async (req, res) => {
  try {
    const { productId } = req.body;

    // Validate required fields
    if (!productId) {
      return res.json({
        success: false,
        message: 'productId is required',
      });
    }

    // Check cache first
    const redisClient = getRedisClient();
    if (redisClient) {
      const cachedProduct = await redisClient.get(`product:${productId}`);
      if (cachedProduct) {
        return res.json({
          success: true,
          message: 'Product details retrieved successfully (from cache)',
          product: JSON.parse(cachedProduct),
          fromCache: true,
        });
      }
    }

    // Get from database
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.json({
        success: false,
        message: 'Product not found',
      });
    }

    // Cache the product
    if (redisClient) {
      await redisClient.setEx(`product:${product.id}`, 3600, JSON.stringify(product));
    }

    res.json({
      success: true,
      message: 'Product details retrieved successfully',
      product,
      fromCache: false,
    });
  } catch (error) {
    console.log('[v0] Error getting product details:', error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { addProduct, getAllProducts, getProductDetails };