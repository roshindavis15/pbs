import { v2 as cloudinary } from 'cloudinary';
import { UniversityCard, Module, Chapter, sequelize } from '../models/index.js';
import { v4 as uuid } from 'uuid';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const addUniversityHierarchy = async (req, res) => {
  console.log(req.body,'req,body is this ')
  const { name, modules } = req.body;
  const files = req.files;

  try {
    // Process UniversityCard icon and image
    const iconFile = files.find((file) => file.fieldname === 'icon');
    const imageFile = files.find((file) => file.fieldname === 'image');

    const iconUrl = iconFile ? await uploadToCloudinary(iconFile, 'universityCard/icons') : null;
    const imageUrl = imageFile ? await uploadToCloudinary(imageFile, 'universityCard/images') : null;

    // Create UniversityCard entry
    const universityCard = await UniversityCard.create({
      name,
      icon: iconUrl,
      image: imageUrl,
    });

    // Process each module
    for (const module of modules) {
      const moduleImageFile = files.find(
        (file) => file.fieldname === `module_${module.name}_image`
      );

      const moduleImageUrl = moduleImageFile
        ? await uploadToCloudinary(moduleImageFile, 'modules/images')
        : null;

      const createdModule = await Module.create({
        name: module.name,
        image: moduleImageUrl,
        universityCardId: universityCard.id,
      });

      // Process each chapter in the module
      for (const chapter of module.chapters) {
        const chapterImageFile = files.find(
          (file) => file.fieldname === `chapter_${chapter.name}_image`
        );

        const chapterPdfFile = files.find(
          (file) => file.fieldname === `chapter_${chapter.name}_pdf`
        );

        const chapterImageUrl = chapterImageFile
          ? await uploadToCloudinary(chapterImageFile, 'chapters/images')
          : null;

        const chapterPdfUrl = chapterPdfFile
          ? await uploadToCloudinary(chapterPdfFile, 'chapters/pdfs')
          : null;

        await Chapter.create({
          name: chapter.name,
          summary: chapter.summary,
          image: chapterImageUrl,
          readingTime: chapter.readingTime,
          pdf: chapterPdfUrl,
          moduleId: createdModule.id,
        });
      }
    }

    res.status(200).json({ message: 'University hierarchy created successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while creating the hierarchy.', error });
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

