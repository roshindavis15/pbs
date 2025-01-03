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

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (file, options = {}) => {
  // If no file is provided, return null
  if (!file) {
    return Promise.resolve(null);
  }

  // Get the buffer from the file object or use the provided buffer
  const buffer = file.buffer || file;

  return new Promise((resolve, reject) => {
    // Default upload options
    const defaultOptions = {
      resource_type: "auto",
      folder: "uploads",
      quality: "auto",
      fetch_format: "auto",
      flags: "attachment"
    };

    // Merge default options with provided options
    const uploadOptions = {
      ...defaultOptions,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }

        // Create both inline and download URLs
        const inlineUrl = `${result.secure_url}?inline=true`;
        const downloadUrl = `${result.secure_url}?attachment=true`;

        resolve({
          inlineUrl,
          downloadUrl,
          publicId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          ...result
        });
      }
    );

    try {
      // Create read stream from buffer
      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (error) {
      console.error("Stream creation error:", error);
      reject(error);
    }
  });
};

// Helper function to delete file from Cloudinary
// const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
//   try {
//     const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
//     return result;
//   } catch (error) {
//     console.error("Cloudinary deletion error:", error);
//     throw error;
//   }
// };

export default uploadToCloudinary ;