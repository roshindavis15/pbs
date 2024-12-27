import { UniversityCard, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';



export const addUniversityHierarchy = async (req, res) => {
  const { id } = req.query; 
  const { name, icon, image, modules } = req.body;

  let transaction; 

  try {   
    transaction = await sequelize.transaction(); 
    let iconUrl, imageUrl;
    if (icon) {
      const iconUpload = await cloudinary.uploader.upload(icon, { folder: 'university/icons' });
      iconUrl = iconUpload.secure_url;
    }

    if (image) {
      const imageUpload = await cloudinary.uploader.upload(image, { folder: 'university/images' });
      imageUrl = imageUpload.secure_url;
    }
    
    let universityCard = await UniversityCard.findOne({ where: { name }, transaction });

    if (universityCard) {
      console.log(`UniversityCard with name "${name}" already exists.`);
    } else {
      
      universityCard = await UniversityCard.create({ name, icon:iconUrl, image:imageUrl }, { transaction });
    }

    for (const moduleData of modules) {
      const { name: moduleName, image: moduleImage, chapters } = moduleData;

     
      let module = await Module.findOne({
        where: { name: moduleName, universityCardId: universityCard.id },
        transaction,
      });

      if (module) {
        console.log(`Module with name "${moduleName}" already exists for this universityCard.`);
      } else {
        
        module = await Module.create(
          {
            name: moduleName,
            image: moduleImage,
            universityCardId: universityCard.id,
          },
          { transaction }
        );
      }

      for (const chapterData of chapters) {
        const { name: chapterName, image: chapterImage, readingTime, pdf, summary } = chapterData;

     
        const chapter = await Chapter.findOne({
          where: { name: chapterName, moduleId: module.id },
          transaction,
        });

        if (chapter) {
          console.log(`Chapter with name "${chapterName}" already exists for this module.`);
        } else {
          
          await Chapter.create(
            {
              name: chapterName,
              image: chapterImage,
              readingTime,
              pdf,
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
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
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

