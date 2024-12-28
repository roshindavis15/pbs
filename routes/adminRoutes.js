import express from 'express';
import { addUniversityHierarchy, deleteData, editChapter, editModule, editUniversityCard, getUniversityHierarchy } from '../controllers/adminController.js';

import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdf') {
      if (!file.mimetype.includes('pdf')) {
        return cb(new Error('Only PDF files are allowed!'), false);
      }
    } else if (file.fieldname === 'icon' || file.fieldname === 'image') {
      if (!file.mimetype.includes('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
      }
    }
    cb(null, true);
  }
});

// Middleware for handling multiple file uploads
const uploadFields = upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'moduleImage', maxCount: 1 },
  { name: 'chapterImage', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);

const adminRouter=express.Router();





adminRouter.post('/add-university-hierarchy', uploadFields, addUniversityHierarchy);
adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
adminRouter.put('/edit-university-card',editUniversityCard);
adminRouter.put('/edit-module',editModule);
adminRouter.put('/edit-chapter',editChapter);
adminRouter.delete('/delete-data',deleteData);



export default adminRouter;






  


