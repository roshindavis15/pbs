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
  console.log(req.body,'>>>>>>>')
  console.log(req.files,'----------')
  console.log(req.body.modulesCount,'$$$$$$$$')

  const modulesCount = parseInt(req.body.modulesCount) || 1;
  
  for (let i = 0; i < modulesCount; i++) {
    fields.push({ name: `modules[${i}][moduleImage]`, maxCount: 1 });
    
    const chaptersCount = parseInt(req.body[`modules[${i}][chaptersCount]`]) || 1;
    for (let j = 0; j < chaptersCount; j++) {
      fields.push({ name: `modules[${i}][chapters][${j}][chapterImage]`, maxCount: 1 });
      fields.push({ name: `modules[${i}][chapters][${j}][pdf]`, maxCount: 1 });
    }
  }
  fields.forEach((item)=>{
    console.log(item,'@@@@@@@@@@@')
  })

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
