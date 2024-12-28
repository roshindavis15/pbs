import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier'
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,

})

const uploadToCloudinary = async (buffer) =>{
    return new Promise ((resolve , reject) =>{
        const uploadStream = cloudinary.uploader.upload_stream({resource_type:"raw",folder:"pdfs"}, (error, result) => {
            if(error,result){
                console.error('cloudinary uplaoed error',error);
                return reject(error)
            }
            const inlineUrl =  `${result?.secuer_url}?inline=true`
            resolve(inlineUrl)
        })
        streamifier.createReadStream(buffer).pipe(uploadStream)
       
    })
}

export default uploadToCloudinary;