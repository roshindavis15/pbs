// models/index.js
import sequelize from '../config/db.js'; 
import Vertical from './vertical.js';
import Module from './module.js';
import Chapter from './chapter.js';

// Remove the associations from individual model files first

// Define all associations here
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

// const initializeDatabase = async () => {
//   try {
  
//       // await sequelize.sync({ alter: true });
//       await sequelize.authenticate();
//       console.log('Database synchronized successfully!');
//   } catch (error) {
//     console.error('Connection error:', error);
//         console.error('Full error:', {
//           name: error.name,
//           code: error.original?.code,
//           errno: error.original?.errno
//         });
//   }
// };

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