import { UniversityCard, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';
import Vertical from '../models/universityCard.js';
import uploadToCloudinary from '../config/cloudinary.js';



export const addUniversityHierarchy = async (req, res) => {
  try {
    const { name } = req.body;
    const modules = typeof req.body.modules === 'string' ? JSON.parse(req.body.modules) : req.body.modules;
    
    // Handle files safely
    const files = req.files || {};
    
    const findFile = (fieldname) => {
      if (Array.isArray(files)) {
        return files.find(file => file.fieldname === fieldname);
      } else if (typeof files === 'object') {
        return files[fieldname]?.[0];
      }
      return null;
    };

    // Process Vertical icon and image
    const iconFile = findFile('icon');
    const imageFile = findFile('image');

    // Upload files to Cloudinary
    const [iconUpload, imageUpload] = await Promise.all([
      iconFile ? uploadToCloudinary(iconFile, 'verticals/icons') : null,
      imageFile ? uploadToCloudinary(imageFile, 'verticals/images') : null
    ]);

    // Create Vertical entry
    const vertical = await Vertical.create({
      name,
      icon: iconUpload?.inlineUrl || null,
      image: imageUpload?.inlineUrl || null,
    });

    // Process each module
    for (const module of modules) {
      const moduleImageFile = findFile(`moduleImage_${module.moduleName}`);
      
      const moduleImageUpload = moduleImageFile
        ? await uploadToCloudinary(moduleImageFile, 'modules/images')
        : null;

      const createdModule = await Module.create({
        moduleName: module.moduleName,
        moduleImage: moduleImageUpload?.inlineUrl || null,
        verticalId: vertical.id,
      });

      // Process each chapter in the module
      if (module.chapters && Array.isArray(module.chapters)) {
        for (const chapter of module.chapters) {
          const chapterImageFile = findFile(`chapterImage_${chapter.chapterName}`);
          const pdfFile = findFile(`pdf_${chapter.chapterName}`);

          const [chapterImageUpload, pdfUpload] = await Promise.all([
            chapterImageFile ? uploadToCloudinary(chapterImageFile, 'chapters/images') : null,
            pdfFile ? uploadToCloudinary(pdfFile, 'chapters/pdfs') : null
          ]);
          console.log("chapter image url:",chapterImageUpload.inlineUrl);
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
    const universityCards = await UniversityCard.findAll({
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
console.log(universityCards,'hi')
    res.status(200).json({
      msg:"successful",
      one: universityCards,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const editUniversityCard = async (req, res) => {
  const { id } = req.query;
  console.log("id:", id);
  const { name, icon, image } = req.body;

  try {
    const universityCard = await UniversityCard.findByPk(id);
    console.log("universityCard:", universityCard);

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
  const { id } = req.query;
  console.log("id:", id);

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

