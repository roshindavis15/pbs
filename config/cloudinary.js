import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const requiredEnvVars = {
  CLOUD_NAME: process.env.CLOUD_NAME,
  API_KEY: process.env.API_KEY,
  API_SECRET: process.env.API_SECRET
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (file, folder = '') => {
  if (!file) {
    return null;
  }

  const buffer = file.buffer || file;
  
  // Determine if the file is a PDF based on mimetype
  const isPDF = file.mimetype === 'application/pdf';

  // Get the original file extension for PDFs
  const fileExtension = isPDF ? '.pdf' : '';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: isPDF ? 'raw' : 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        public_id: isPDF ? `${Date.now()}${fileExtension}` : undefined // Add .pdf extension for PDF files
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        
        const url = result.secure_url;
        
        resolve({
          inlineUrl: isPDF ? url : `${url}?inline=true`,
          downloadUrl: isPDF ? `${url}?dl=1` : `${url}?attachment=true`,
          publicId: result.public_id
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export default uploadToCloudinary;