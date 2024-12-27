import express from 'express';
import { validate } from '../middlewares/validation.js';
import { addUniversityHierarchy, deleteData, editChapter, editModule, editUniversityCard, getUniversityHierarchy } from '../controllers/adminController.js';


const adminRouter=express.Router();


adminRouter.post('/add-university-hierarchy', addUniversityHierarchy);
adminRouter.get('/get-university-hierarchy', getUniversityHierarchy);
adminRouter.put('/edit-university-card',editUniversityCard);
adminRouter.put('/edit-module',editModule);
adminRouter.put('/edit-chapter',editChapter);
adminRouter.delete('/delete-data',deleteData);



export default adminRouter;






  


