import express from 'express';
import { addUniversityHierarchy, deleteData, editChapter, editModule, editUniversityCard, getUniversityHierarchy } from '../controllers/adminController.js';
import multer from 'multer';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const allowedPDFTypes = ['application/pdf'];

// Multer configuration
const storage = multer.memoryStorage();

// File filter function with logging
const fileFilter = (req, file, cb) => {
  console.log('Processing file:', {
    fieldname: file.fieldname,
    mimetype: file.mimetype
  });

  // Check file type based on fieldname
  if (file.fieldname === 'icon' || 
      file.fieldname === 'image' || 
      file.fieldname.startsWith('moduleImage') ||
      file.fieldname.startsWith('chapterImage')) {
    if (!allowedImageTypes.includes(file.mimetype)) {
      console.log('Rejected image file:', file.fieldname, 'Invalid mimetype:', file.mimetype);
      return cb(new Error('Only jpeg, jpg, png, and gif images are allowed!'), false);
    }
    console.log('Accepted image file:', file.fieldname);
    cb(null, true);
  } else if (file.fieldname.startsWith('pdf')) {
    if (!allowedPDFTypes.includes(file.mimetype)) {
      console.log('Rejected PDF file:', file.fieldname, 'Invalid mimetype:', file.mimetype);
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    console.log('Accepted PDF file:', file.fieldname);
    cb(null, true);
  } else {
    console.log('Rejected file - unexpected field:', file.fieldname);
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

const createUploadMiddleware = (req, res, next) => {
  console.log('A. Starting upload middleware');
  console.log('B. Request body before parse:', req.body);
  
  // If modules is a string, parse it
  let modulesData;
  try {
    modulesData = typeof req.body.modules === 'string' 
      ? JSON.parse(req.body.modules) 
      : req.body.modules;
    console.log('C. Parsed modules data:', modulesData);
  } catch (error) {
    console.error('D. Error parsing modules:', error);
  }

  // Create upload fields dynamically
  const uploadFields = [
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ];

  // Add fields for modules and chapters
  if (modulesData) {
    modulesData.forEach(module => {
      const moduleFieldName = `moduleImage_${module.moduleName}`;
      uploadFields.push({ name: moduleFieldName, maxCount: 1 });
      console.log('Added module field:', moduleFieldName);

      if (module.chapters) {
        module.chapters.forEach(chapter => {
          const chapterImageFieldName = `chapterImage_${chapter.chapterName}`;
          const pdfFieldName = `pdf_${chapter.chapterName}`;
          uploadFields.push({ name: chapterImageFieldName, maxCount: 1 });
          uploadFields.push({ name: pdfFieldName, maxCount: 1 });
          console.log('Added chapter fields:', { chapterImageFieldName, pdfFieldName });
        });
      }
    });
  }

  console.log('E. Configured upload fields:', uploadFields);

  const multipleUpload = upload.fields(uploadFields);
  console.log('F. Created upload middleware');

  multipleUpload(req, res, function(err) {
    console.log('Raw req.body:', req.body);
    console.log('Raw req.files:', req.files);
    console.log('Parsed modules data:', req.body.modules);
    
    console.log('G. Inside upload callback');
    console.log('H. Files received:', Object.keys(req.files || {}));
    console.log('I. Detailed files:', JSON.stringify(req.files, null, 2));
    console.log('J. Body after upload:', req.body);
    
    if (err instanceof multer.MulterError) {
      console.error('K. Multer error:', err);
      return res.status(400).json({
        error: true,
        message: `Upload error: ${err.message}`,
        details: err
      });
    } else if (err) {
      console.error('L. Other error:', err);
      return res.status(500).json({
        error: true,
        message: `Server error: ${err.message}`,
        details: err
      });
    }
    
    console.log('M. Upload successful, moving to next middleware');
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

// Single default export
export default adminRouter;