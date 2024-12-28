import express from 'express';
import { addUniversityHierarchy, deleteData, editChapter, editModule, editUniversityCard, getUniversityHierarchy } from '../controllers/adminController.js';

import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const adminRouter = express.Router();

adminRouter.post('/add-university-hierarchy',upload.any(), addUniversityHierarchy);
adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
adminRouter.put('/edit-university-card',editUniversityCard);
adminRouter.put('/edit-module',editModule);
adminRouter.put('/edit-chapter',editChapter);
adminRouter.delete('/delete-data',deleteData);



export default adminRouter;






  


