import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'university/uploads' }, // Auto resource_type to handle images and PDFs
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error', error);
                    return reject(error);
                }
                resolve(result.secure_url); // Return the secure_url directly
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

export default uploadToCloudinary;
