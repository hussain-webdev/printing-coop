import express from 'express';
import { getSellerImages, addImagesToZone, createFolder, renameFolder, deleteFolder, deleteImage } from '../controllers/imageZoneController.js';
import upload from '../middleware/multer.js';

const imageZoneRouter = express.Router();

// Get all images and folders for a seller
imageZoneRouter.post('/get-images', getSellerImages);

// Add images to seller's ImageZone
imageZoneRouter.post('/add-images', upload.array('images', 10), addImagesToZone);

// Folder management routes
imageZoneRouter.post('/create-folder', createFolder);
imageZoneRouter.post('/rename-folder', renameFolder);
imageZoneRouter.post('/delete-folder', deleteFolder);

// Image management routes
imageZoneRouter.post('/delete-image', deleteImage);

export default imageZoneRouter;
