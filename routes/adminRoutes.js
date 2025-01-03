import express from 'express';
import { addUniversityHierarchy, deleteData, editChapter, editModule, editUniversityCard, getUniversityHierarchy } from '../controllers/adminController.js';

import multer from 'multer';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const allowedPDFTypes = ['application/pdf'];

// Multer configuration
const storage = multer.memoryStorage();


// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type based on fieldname
  if (file.fieldname === 'icon' || 
      file.fieldname === 'image' || 
      file.fieldname.startsWith('moduleImage_') ||
      file.fieldname.startsWith('chapterImage_')) {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only jpeg, jpg, png, and gif images are allowed!'), false);
    }
    cb(null, true);
  } else if (file.fieldname.startsWith('pdf_')) {
    if (!allowedPDFTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  } else {
    cb(new Error('Unexpected field!'), false);
  }
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 20 // Maximum number of files
  }
});

const uploadMiddleware = (req, res, next) => {
  const uploadFields = [
      { name: 'image1', maxCount: 1 },
      { name: 'image2', maxCount: 1 },
      { name: 'image3', maxCount: 1 },
      { name: 'image4', maxCount: 1 },
      { name: 'pdfFile', maxCount: 1 }
  ];

  const multipleUpload = upload.fields(uploadFields);

  multipleUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
          // Multer error handling
          return res.status(400).json({
              error: true,
              message: `Upload error: ${err.message}`
          });
      } else if (err) {
          // Other errors
          return res.status(500).json({
              error: true,
              message: `Server error: ${err.message}`
          });
      }
      // If successful, proceed to next middleware
      next();
  });
};

const adminRouter = express.Router();


const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 20 files.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};



adminRouter.post('/add-university-hierarchy',uploadMiddleware, addUniversityHierarchy);
adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
adminRouter.put('/edit-university-card',editUniversityCard);
adminRouter.put('/edit-module',editModule);
adminRouter.put('/edit-chapter',editChapter);
adminRouter.delete('/delete-data',deleteData);



export default adminRouter;






  


