// models/index.js
import sequelize from '../config/db.js'; 
import UniversityCard from './universityCard.js';
import Module from './module.js';
import Chapter from './chapter.js';

// Remove the associations from individual model files first

// Define all associations here
UniversityCard.hasMany(Module, { 
    foreignKey: 'universityCardId', 
    as: 'modules' 
});

Module.belongsTo(UniversityCard, { 
    foreignKey: 'universityCardId'
});

Module.hasMany(Chapter, { 
    foreignKey: 'moduleId', 
    as: 'chapters' 
});

Chapter.belongsTo(Module, { 
    foreignKey: 'moduleId'
});

const initializeDatabase = async () => {
  try {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized successfully!');
  } catch (error) {
      console.error('Error synchronizing database:', error);
  }
};

export { 
  sequelize, 
  UniversityCard, 
  Module, 
  Chapter, 
  initializeDatabase 
};