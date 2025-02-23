  import express from 'express';
  import {
    addUniversityHierarchy,
    adminLogin,
    adminLogout,
    deleteData,
    // editChapter,
    // editModule,
    editVertical,
    getUniversityHierarchy,
  } from '../controllers/adminController.js';
  import multer from 'multer';

  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    console.log(req.file)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    const allowedPDFTypes = ['application/pdf'];

    if (file.fieldname === 'icon' || file.fieldname === 'image' || 
        file.fieldname.match(/^modules\[\d+\]\[moduleImage\]$/) ||
        file.fieldname.match(/^modules\[\d+\]\[chapters\]\[\d+\]\[chapterImage\]$/)) {
      return cb(null, allowedImageTypes.includes(file.mimetype));
    }
    
    if (file.fieldname.match(/^modules\[\d+\]\[chapters\]\[\d+\]\[pdf\]$/)) {
      return cb(null, allowedPDFTypes.includes(file.mimetype));
    }

    cb(null, false);
  };

  const createUploadMiddleware = (req, res, next) => {
    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 50
      }
    });
  
 
    const fields = [
      { name: 'icon', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ];
  
  
   
    for (let i = 0; i < 5; i++) { 
      fields.push({ name: `modules[${i}][moduleImage]`, maxCount: 1 });
      
      for (let j = 0; j < 10; j++) { 
        fields.push({ name: `modules[${i}][chapters][${j}][chapterImage]`, maxCount: 1 });
        fields.push({ name: `modules[${i}][chapters][${j}][pdf]`, maxCount: 1 });
      }
    }
  
  
    upload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: true, message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(500).json({ error: true, message: `Server error: ${err.message}` });
      }
      next();
    });
  };




 
  const adminRouter = express.Router();


  adminRouter.post('/add-university-hierarchy', createUploadMiddleware, addUniversityHierarchy);
  adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
    // adminRouter.put('/edit-vertical', editVertical);
    // adminRouter.put('/edit-module', editModule);
    // adminRouter.put('/edit-chapter', editChapter);
    adminRouter.put('/edit-vertical',editVertical)
  adminRouter.delete('/delete-data', deleteData);
  adminRouter.post('/login',adminLogin);
  adminRouter.post('/logout',adminLogout);
 

  export default adminRouter; 
