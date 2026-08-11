import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1', // Use your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to AWS S3
 * @param {Buffer|string} fileData - File buffer or local file path
 * @param {string} s3Key - S3 key (full path including filename)
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} - Object with url and key properties
 */
const uploadToS3 = async (fileData, s3Key, mimeType = 'application/octet-stream') => {
  try {
    let fileBuffer;

    // If fileData is a string, treat it as a file path and read from filesystem
    if (typeof fileData === 'string') {
      fileBuffer = fs.readFileSync(fileData);
    } else if (Buffer.isBuffer(fileData)) {
      // If it's already a buffer, use it directly (from multer memory storage)
      fileBuffer = fileData;
    } else {
      throw new Error('fileData must be a Buffer or file path string');
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Construct the S3 URL
    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${s3Key}`;
    
    return {
      url: s3Url,
      key: s3Key, // Store the key for potential deletion later
    };
  } catch (error) {
    console.log('[v0] Error uploading to S3:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

export { uploadToS3, s3Client };
