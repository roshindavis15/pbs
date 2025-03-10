import { Vertical, Module, Chapter } from '../models/index.js';
import uploadToCloudinary from '../config/cloudinary.js';
import jwt from "jsonwebtoken";
import { query } from 'express';




export const addUniversityHierarchy = async (req, res) => {
  try {
    const { name } = req.body;
    const modules = typeof req.body.modules === 'string' ? JSON.parse(req.body.modules) : req.body.modules;
    const files = req.files || {};

  
    const iconFile = files['icon']?.[0];
    const imageFile = files['image']?.[0];

    const [iconUpload, imageUpload] = await Promise.all([
      iconFile ? uploadToCloudinary(iconFile, 'verticals/icons') : null,
      imageFile ? uploadToCloudinary(imageFile, 'verticals/images') : null
    ]);

    const vertical = await Vertical.create({
      name,
      icon: iconUpload?.inlineUrl || null,
      image: imageUpload?.inlineUrl || null,
    });

  
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const moduleImageFile = files[`modules[${i}][moduleImage]`]?.[0];
      
      const moduleImageUpload = moduleImageFile
        ? await uploadToCloudinary(moduleImageFile, 'modules/images')
        : null;

      const createdModule = await Module.create({
        moduleName: module.moduleName,
        moduleImage: moduleImageUpload?.inlineUrl || null,
        verticalId: vertical.id,
      });

      if (module.chapters && Array.isArray(module.chapters)) {
        for (let j = 0; j < module.chapters.length; j++) {
          const chapter = module.chapters[j];
          const chapterImageFile = files[`modules[${i}][chapters][${j}][chapterImage]`]?.[0];
          const pdfFile = files[`modules[${i}][chapters][${j}][pdf]`]?.[0];

          const [chapterImageUpload, pdfUpload] = await Promise.all([
            chapterImageFile ? uploadToCloudinary(chapterImageFile, 'chapters/images') : null,
            pdfFile ? uploadToCloudinary(pdfFile, 'chapters/pdfs') : null
          ]);

          await Chapter.create({
            chapterName: chapter.chapterName,
            summary: chapter.summary,
            chapterImage: chapterImageUpload?.inlineUrl || null,
            readingTime: chapter.readingTime,
            pdf: pdfUpload?.inlineUrl || null,
            moduleId: createdModule.id,
          });
        }
      }
    }

    res.status(200).json({ message: 'University hierarchy created successfully.' });
  } catch (error) {
    console.error('Error creating hierarchy:', error);
    res.status(500).json({ 
      message: 'An error occurred while creating the hierarchy.', 
      error: error.message 
    });
  }
};

export const getUniversityHierarchy = async (req, res) => {

  try {
    const vertical = await Vertical.findAll({
      include: [
        {
          model: Module,
          as: 'modules',
          include: [
            {
              model: Chapter,
              as: 'chapters',
              attributes: ['id', 'chapterName','summary', 'chapterImage', 'readingTime', 'pdf'],
            },
          ],
          attributes: ['id', 'moduleName', 'moduleImage'],
        },
      ],
      attributes: ['id', 'name', 'icon', 'image'],
    });


    res.status(200).json({
      msg:"successful",
      data: vertical,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// export const editVertical = async (req, res) => {
//   const { id } = req.query;
//   console.log("id:", id);
//   const { name, icon, image } = req.body3;

//   try {
//     const vertical = await Vertical.findByPk(id);
//     console.log("universityCard:", universityCard);

//     if (!vertical) {
//       return res.status(404).json({
//         success: false,
//         message: 'vertical  not found'
//       });
//     }

//     await vertical.update({ name, icon, image });

//     res.status(200).json({
//       success: true,
//       message: 'vertical updated successfully',
//       data: vertical
//     });
//   } catch (error) {
//     console.error('Error in vertical:', error);
//     res.status(500).json({ success: false, error: 'Server error' });
//   }
// };

// export const editModule = async (req, res) => {
//   const { id } = req.query;
//   const { name, image } = req.body;

//   try {
//     const module = await Module.findByPk(id);

//     if (!module) {
//       return res.status(404).json({
//         success: false,
//         message: 'Module not found'
//       });
//     }

//     await module.update({ name, image });

//     res.status(200).json({
//       success: true,
//       message: 'Module updated successfully',
//       data: module
//     });
//   } catch (error) {
//     console.error('Error in editModule:', error);
//     res.status(500).json({ success: false, error: 'Server error' });
//   }
// };


// export const editChapter = async (req, res) => {
//   const { id } = req.query;
//   console.log("id:", id);
//   const { name, image, readingTime, pdf, summary } = req.body;

//   try {
//     const chapter = await Chapter.findByPk(id);
//     console.log("chapter:", chapter);

//     if (!chapter) {
//       console.log("herer")
//       return res.status(404).json({
//         success: false,
//         message: 'Chapter not found'
//       });
//     }

//     await chapter.update({
//       name,
//       image,
//       readingTime,
//       pdf,
//       summary
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Chapter updated successfully',
//       data: chapter
//     });
//   } catch (error) {
//     console.error('Error in editChapter:', error);
//     res.status(500).json({ success: false, error: 'Server error' });
//   }
// };


export const deleteData = async (req, res) => {
  console.log("req.query:",req.query);
  const { id } = req.query;
  console.log("id:", id);

  try {
   
    const vertical = await Vertical.findByPk(id);
    if (vertical) {
     
      await Module.destroy({
        where: { verticalId: id },
      });
      await Vertical.destroy({
        where: { id },
      });
      return res.status(200).json({ message: 'Vertical and related modules deleted successfully.' });
    }

   
    const module = await Module.findByPk(id);
    if (module) {
   
      await Chapter.destroy({
        where: { moduleId: id },
      });
      await Module.destroy({
        where: { id },
      });
      return res.status(200).json({ message: 'Module and related chapters deleted successfully.' });
    }

    const chapter = await Chapter.findByPk(id);
    if (chapter) {
      await Chapter.destroy({
        where: { id },
      });
      return res.status(200).json({ message: 'Chapter deleted successfully.' });
    }

    return res.status(404).json({ message: 'Item not found.' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}


export const adminLogin=async(req,res)=>{
  const {email,password}=req.body;
  if(email !== process.env.ADMIN_EMAIL){
    return res.status(401).json({message:'unauthorized'});
  }
  const isMatch=await bcrypt.compare(password,process.env.ADMIN_PASSWORD);
  if(!isMatch){
    return res.status(401).json({message:'Invalid credentials'})
  }

  const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:'1h'});
  
  res.cookie("token",token,{
    httpOnly:true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict"
  });

  res.json({ message: "Logged in successfully" });


}


export const  adminLogout=async(req,res)=>{
  res.clearCookie("token",{
    httpOnly:true,
    secure:true,
    sameSite:"Strict"
  });
  res.json({message:"Loggout successfully"});
}

export const editVertical=async(req,res)=>{
  const data= req.body;
  const id=req.query;
  console.log("dataaa:",data);
  console.log("id:",id)
}