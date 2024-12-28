import uploadToCloudinary from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';
import { UniversityCard, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';



export const addUniversityHierarchy = async (req, res) => {

  const { id } = req.query;
  const { metadata } = req.body;
  const formData = JSON.parse(metadata);
  const { name, modules } = formData;

  console.log("name:",name);
  console.log("modules:",modules)
  let parsedModules;

  let transaction;
  try {

    try {
      parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;
      console.log("parsedModules:",parsedModules);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid modules data format'
      });
    }
    transaction = await sequelize.transaction();


//     let iconUrl, imageUrl;
//     const iconFile = req.files.find(file => file.fieldname === 'icon');
//     const imageFile = req.files.find(file => file.fieldname === 'image');
    
//     if (req?.files && iconFile) {
//       const iconBuffer = iconFile?.buffer;
//       try {
//         iconUrl = await uploadToCloudinary(iconBuffer);
//       } catch (error) {
//           console.error('Error uploading icon:', error);
//       }
//   }

//   if (req?.files && imageFile) {
//     const imageBuffer = imageFile?.buffer;
//     try {
//       iconUrl = await uploadToCloudinary(imageBuffer);
//     } catch (error) {
//         console.error('Error uploading icon:', error);
//     }
// }



const uploadedFiles = {}; 

if (req?.files?.length > 0) {
  for (const file of req.files) {
    const { fieldname, buffer } = file;

    try {
      const uploadedUrl = await uploadToCloudinary(buffer);
      if (!uploadedFiles[fieldname]) {
        uploadedFiles[fieldname] = [];
      }
      uploadedFiles[fieldname].push(uploadedUrl);
    } catch (error) {
      console.error(`Error uploading file with fieldname ${fieldname}:`, error);
    }
  }
}

console.log('Uploaded Files:', uploadedFiles);


    let universityCard = await UniversityCard.findOne({
      where: { name },
      transaction
    });

    if (!universityCard) {
      universityCard = await UniversityCard.create(
        { name, icon: iconUrl, image: imageUrl },
        { transaction }
      );
    }

    // Process modules
    for (const moduleData of parsedModules) {
      const { name: moduleName, chapters } = moduleData;

      let moduleImageUrl;
      if (req.files.moduleImage) {
        const moduleImageBuffer = req.files.moduleImage[0].buffer;
        const moduleImageUpload = await cloudinary.uploader.upload(
          `data:${req.files.moduleImage[0].mimetype};base64,${moduleImageBuffer.toString('base64')}`,
          { folder: 'university/modules' }
        );
        moduleImageUrl = moduleImageUpload.secure_url;
      }

      let module = await Module.findOne({
        where: { name: moduleName, universityCardId: universityCard.id },
        transaction,
      });

      if (!module) {
        module = await Module.create(
          {
            name: moduleName,
            image: moduleImageUrl,
            universityCardId: universityCard.id,
          },
          { transaction }
        );
      }

      // Process chapters
      for (const chapterData of chapters) {
        const { name: chapterName, readingTime, summary } = chapterData;

        let chapterImageUrl, pdfUrl;
        if (req.files.chapterImage) {
          const chapterImageBuffer = req.files.chapterImage[0].buffer;
          const chapterImageUpload = await cloudinary.uploader.upload(
            `data:${req.files.chapterImage[0].mimetype};base64,${chapterImageBuffer.toString('base64')}`,
            { folder: 'university/chapters' }
          );
          chapterImageUrl = chapterImageUpload.secure_url;
        }

        if (req.files.pdf) {
          const pdfBuffer = req.files.pdf[0].buffer;
          const pdfUpload = await cloudinary.uploader.upload(
            `data:${req.files.pdf[0].mimetype};base64,${pdfBuffer.toString('base64')}`,
            { 
              folder: 'university/pdfs',
              resource_type: 'raw' 
            }
          );
          pdfUrl = pdfUpload.secure_url;
        }

        const chapter = await Chapter.findOne({
          where: { name: chapterName, moduleId: module.id },
          transaction,
        });

        if (!chapter) {
          await Chapter.create(
            {
              name: chapterName,
              image: chapterImageUrl,
              readingTime,
              pdf: pdfUrl,
              summary,
              moduleId: module.id,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();


    res.status(201).json({
      success: true,
      message: 'University hierarchy added successfully',
      id,
      universityCard: { id: universityCard.id, name: universityCard.name },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};




export const getUniversityHierarchy = async (req, res) => {
  try {
    const universityCards = await UniversityCard.findAll({
      include: [
        {
          model: Module,
          as: 'modules',
          include: [
            {
              model: Chapter,
              as: 'chapters',
              attributes: ['id', 'name', 'image', 'readingTime', 'pdf'],
            },
          ],
          attributes: ['id', 'name', 'image'],
        },
      ],
      attributes: ['id', 'name', 'icon', 'image'],
    });

    res.status(200).json({
      success: true,
      data: universityCards,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

  export const editUniversityCard = async (req, res) => {
    const { id } = req.query;
    console.log("id:",id);
    const { name, icon, image } = req.body;

    try {
      const universityCard = await UniversityCard.findByPk(id);
      console.log("universityCard:",universityCard);  

      if (!universityCard) {
        return res.status(404).json({
          success: false,
          message: 'University card not found'
        });
      }

      await universityCard.update({ name, icon, image });

      res.status(200).json({
        success: true,
        message: 'University card updated successfully',
        data: universityCard
      });
    } catch (error) {
      console.error('Error in editUniversityCard:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };

export const editModule = async (req, res) => {
  const { id } = req.query;
  const { name, image } = req.body;

  try {
    const module = await Module.findByPk(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    await module.update({ name, image });

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });
  } catch (error) {
    console.error('Error in editModule:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


export const editChapter = async (req, res) => {
  const { id } = req.query;
  console.log("id:",id);
  const { name, image, readingTime, pdf, summary } = req.body;

  try {
    const chapter = await Chapter.findByPk(id);
    console.log("chapter:",chapter);

    if (!chapter) {
      console.log("herer")
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    await chapter.update({
      name,
      image,
      readingTime,
      pdf,
      summary
    });

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Error in editChapter:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};


export const deleteData= async(req,res)=>{
  const {id}=req.query;
  console.log("id:",id);

  try {
    // Check if it's a UniversityCard
    const universityCard = await UniversityCard.findByPk(id);
    if (universityCard) {
      // Delete related modules and chapters
      await Module.destroy({
        where: { universityCardId: id },
      });
      await UniversityCard.destroy({
        where: { id },
      });
      return res.status(200).json({ message: 'University card and related modules deleted successfully.' });
    }

    // Check if it's a Module
    const module = await Module.findByPk(id);
    if (module) {
      // Delete related chapters
      await Chapter.destroy({
        where: { moduleId: id },
      });
      await Module.destroy({
        where: { id },
      });
      return res.status(200).json({ message: 'Module and related chapters deleted successfully.' });
    }

    // Check if it's a Chapter
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

