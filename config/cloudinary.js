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
  // Destructure options with default value for returnFullObject
  const { returnFullObject = false, ...otherOptions } = options;

  // If no file is provided, return null
  if (!file) {
    return Promise.resolve(null);
  }

  // Get the buffer from the file object or use the provided buffer
  const buffer = file.buffer || file;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: "raw",
      quality: "auto",
      fetch_format: "auto",
      flags: "attachment",
      ...otherOptions  // Spread any additional options passed
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }

        if (returnFullObject) {
          resolve({
            inlineUrl: `${result.secure_url}?inline=true`,
            downloadUrl: `${result.secure_url}?attachment=true`,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            ...result
          });
        } else {
          resolve(`${result.secure_url}?inline=true`);
        }
      }
    ).end(buffer);  // Use the correct buffer variable here
  });
};

export default uploadToCloudinary;