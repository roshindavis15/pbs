

const uploadToCloudinary = async (file, folder) => {
    const result = await cloudinary.uploader.upload_stream({
      folder,
      resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    });
  
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
  
      stream.end(file.buffer);
    });
  };