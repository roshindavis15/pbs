import { v2 as cloudinary } from 'cloudinary';
import { UniversityCard, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';
import Vertical from '../models/universityCard.js';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addUniversityHierarchy = async (req, res) => {
  console.log('req.body:', req.body);
  const { name, modules } = req.body;
  const files = req.files;

  try {
    // Process Vertical icon and image
    const iconFile = files.find((file) => file.fieldname === 'icon');
    const imageFile = files.find((file) => file.fieldname === 'image');

    const iconUrl = iconFile ? await uploadToCloudinary(iconFile, 'verticals/icons') : null;
    const imageUrl = imageFile ? await uploadToCloudinary(imageFile, 'verticals/images') : null;

    // Create Vertical entry
    const vertical = await Vertical.create({
      name,
      icon: iconUrl,
      image: imageUrl,
    });

    // Process each module
    for (const module of modules) {
      const moduleImageFile = files.find(
        (file) => file.fieldname === `moduleImage_${module.moduleName}`
      );

      const moduleImageUrl = moduleImageFile
        ? await uploadToCloudinary(moduleImageFile, 'modules/images')
        : null;

      const createdModule = await Module.create({
        moduleName: module.moduleName,
        moduleImage: moduleImageUrl,
        verticalId: vertical.id,
      });

      // Process each chapter in the module
      if (module.chapters) {
        for (const chapter of module.chapters) {
          const chapterImageFile = files.find(
            (file) => file.fieldname === `chapterImage_${chapter.chapterName}`
          );

          const pdfFile = files.find(
            (file) => file.fieldname === `pdf_${chapter.chapterName}`
          );

          const chapterImageUrl = chapterImageFile
            ? await uploadToCloudinary(chapterImageFile, 'chapters/images')
            : null;

          const pdfUrl = pdfFile
            ? await uploadToCloudinary(pdfFile, 'chapters/pdfs')
            : null;

          await Chapter.create({
            chapterName: chapter.chapterName,
            summary: chapter.summary,
            chapterImage: chapterImageUrl,
            readingTime: chapter.readingTime,
            pdf: pdfUrl,
            moduleId: createdModule.id,
          });
        }
      }
    }

    res.status(200).json({ message: 'University hierarchy created successfully.' });
  } catch (error) {
    console.error('Error creating hierarchy:', error);
    res.status(500).json({ message: 'An error occurred while creating the hierarchy.', error.message });
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

