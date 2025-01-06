import express from 'express';
import {
  addUniversityHierarchy,
  deleteData,
  editChapter,
  editModule,
  editUniversityCard,
  getUniversityHierarchy,
} from '../controllers/adminController.js';
import multer from 'multer';


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  const allowedPDFTypes = ['application/pdf'];

  // Check if field name matches our expected patterns
  if (file.fieldname === 'icon' || file.fieldname === 'image' || 
      file.fieldname.startsWith('moduleImage') || 
      file.fieldname.startsWith('chapterImage')) {
    
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image type'), false);
    }
    return cb(null, true);
  }
  
  if (file.fieldname.startsWith('pdf')) {
    if (!allowedPDFTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid PDF type'), false);
    }
    return cb(null, true);
  }

  cb(null, false);
};

const createUploadMiddleware = (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 50 // Increased limit to handle multiple files
    }
  });

  // Create dynamic field configuration
  const fields = [
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ];

  // Add dynamic fields for modules and chapters
  for (let i = 0; i < 10; i++) { // Support up to 10 modules
    fields.push({ name: `moduleImage_${i}`, maxCount: 1 });
    
    for (let j = 0; j < 10; j++) { // Support up to 10 chapters per module
      fields.push({ name: `chapterImage_${i}_${j}`, maxCount: 1 });
      fields.push({ name: `pdf_${i}_${j}`, maxCount: 1 });
    }
  }

  // Apply multer middleware
  upload.fields(fields)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err.message,'5678')
      return res.status(400).json({
        error: true,
        message: `Upload error: ${err.message}`
      });
    }
    if (err) {
      return res.status(500).json({
        error: true,
        message: `Server error: ${err.message}`
      });
    }
    next();
  });
};


// Create Router
const adminRouter = express.Router();

// Define routes
adminRouter.post('/add-university-hierarchy', createUploadMiddleware, addUniversityHierarchy);
adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
adminRouter.put('/edit-university-card', editUniversityCard);
adminRouter.put('/edit-module', editModule);
adminRouter.put('/edit-chapter', editChapter);
adminRouter.delete('/delete-data', deleteData);

export default adminRouter; // Ensure this is the only default export
