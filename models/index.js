// models/index.js
import sequelize from '../config/db.js'; 
import Vertical from './vertical.js';
import Module from './module.js';
import Chapter from './chapter.js';




Vertical.hasMany(Module, { 
    foreignKey: 'verticalId', 
    as: 'modules' 
});

Module.belongsTo(Vertical, { 
    foreignKey: 'verticalId'
});

Module.hasMany(Chapter, { 
    foreignKey: 'moduleId', 
    as: 'chapters' 
});

Chapter.belongsTo(Module, { 
    foreignKey: 'moduleId'
});



export const initializeDatabase = async () => {
  try {
    console.log('Synchronizing database...');
    await sequelize.sync({alter:true}); // Sync models to the database schema
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Database initialization error details:', error.message);
    throw new Error('Database connection failed');
  }
};


export { 
  sequelize, 
  Vertical, 
  Module, 
  Chapter, 
};