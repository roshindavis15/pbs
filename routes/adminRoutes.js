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

// Allowed MIME types for validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const allowedPDFTypes = ['application/pdf'];

// Multer storage configuration
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // console.log('Processing file:', { fieldname: file.fieldname, mimetype: file.mimetype });

  // Validate file type based on field name
  if (
    file.fieldname === 'icon' ||
    file.fieldname === 'image' ||
    file.fieldname === 'moduleImage' ||
    file.fieldname === 'chapterImage' 
    // file.fieldname.startsWith('moduleImage') ||
    // file.fieldname.startsWith('chapterImage')
  ) {
    if (!allowedImageTypes.includes(file.mimetype)) {
      console.error('Rejected image file:', file.fieldname, 'Invalid mimetype:', file.mimetype);
      return cb(new Error('Only jpeg, jpg, png, gif, and webp images are allowed!'), false);
    }
    cb(null, true);
  } else if (file.fieldname === 'pdf') {
    if (!allowedPDFTypes.includes(file.mimetype)) {
      console.error('Rejected PDF file:', file.fieldname, 'Invalid mimetype:', file.mimetype);
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  } else {
    console.error('Rejected file - unexpected field:', file.fieldname);
    cb(new Error('Unexpected field!'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 20, // Max number of files
  },
});

// Middleware to dynamically handle file uploads
const createUploadMiddleware = (req, res, next) => {
  // console.log('A. Starting upload middleware');

  let modulesData;
  try {
    // Parse modules data from request body
    modulesData = typeof req.body.modules === 'string'
      ? JSON.parse(req.body.modules)
      : req.body.modules;
    console.log('C. Parsed modules data:', modulesData);
  } catch (error) {
    console.error('D. Error parsing modules data:', error);
    return res.status(400).json({
      error: true,
      message: 'Invalid modules data in request body!',
    });
  }

  // Create upload fields
  const uploadFields = [
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ];

  if (modulesData) {
    modulesData.forEach((module) => {
      const moduleFieldName = `moduleImage`;
      uploadFields.push({ name: moduleFieldName, maxCount: 1 });
      console.log('Added module field:', moduleFieldName);

      if (module.chapters) {
        module.chapters.forEach((chapter) => {
          const chapterImageFieldName = `chapterImage`;
          const pdfFieldName = `pdf`;
          uploadFields.push({ name: chapterImageFieldName, maxCount: 1 });
          uploadFields.push({ name: pdfFieldName, maxCount: 1 });
          console.log('Added chapter fields:', { chapterImageFieldName, pdfFieldName });
        });
      }
    });
  }

  console.log('E. Configured upload fields:', uploadFields);

  const multipleUpload = upload.fields(uploadFields);

  multipleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('K. Multer error:', err);
      return res.status(400).json({
        error: true,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      console.error('L. Unexpected error:', err);
      return res.status(500).json({
        error: true,
        message: `Server error: ${err.message}`,
      });
    }

    // console.log('M. Files successfully uploaded:', Object.keys(req.files || {}));
    // console.log('N. Detailed file data:', JSON.stringify(req.files, null, 2));
    // console.log('O. Body after upload:', req.body);

    // Proceed to the next middleware
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
