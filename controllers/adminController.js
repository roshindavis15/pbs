import { Vertical, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';
import uploadToCloudinary from '../config/cloudinary.js';



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
              attributes: ['id', 'chapterName', 'chapterImage', 'readingTime', 'pdf'],
            },
          ],
          attributes: ['id', 'moduleName', 'moduleImage'],
        },
      ],
      attributes: ['id', 'name', 'icon', 'image'],
    });

   for(let modules of vertical?.dataValues?.modules){
    console.log(modules,'this is modules &&&&&&&&')
    // for(let chp of modules.chapters){
    //   console.log(chp,'this is chpater-----------')
    // }
   }
    res.status(200).json({
      msg:"successful",
      data: vertical,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const editVertical = async (req, res) => {
  const { id } = req.query;
  console.log("id:", id);
  const { name, icon, image } = req.body3;

  try {
    const vertical = await Vertical.findByPk(id);
    console.log("universityCard:", universityCard);

    if (!vertical) {
      return res.status(404).json({
        success: false,
        message: 'vertical  not found'
      });
    }

    await vertical.update({ name, icon, image });

    res.status(200).json({
      success: true,
      message: 'vertical updated successfully',
      data: vertical
    });
  } catch (error) {
    console.error('Error in vertical:', error);
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
  console.log("id:", id);
  const { name, image, readingTime, pdf, summary } = req.body;

  try {
    const chapter = await Chapter.findByPk(id);
    console.log("chapter:", chapter);

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


export const deleteData = async (req, res) => {
  const { delteID } = req.query;
  console.log("id:", delteID);

  try {
   
    const vertical = await Vertical.findByPk(delteID);
    if (vertical) {
     
      await Module.destroy({
        where: { verticalId: delteID },
      });
      await Vertical.destroy({
        where: { delteID },
      });
      return res.status(200).json({ message: 'Vertical and related modules deleted successfully.' });
    }

   
    const module = await Module.findByPk(delteID);
    if (module) {
   
      await Chapter.destroy({
        where: { moduleId: delteID },
      });
      await Module.destroy({
        where: { delteID },
      });
      return res.status(200).json({ message: 'Module and related chapters deleted successfully.' });
    }

    const chapter = await Chapter.findByPk(delteID);
    if (chapter) {
      await Chapter.destroy({
        where: { delteID },
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


