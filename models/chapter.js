// chapter.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Chapter = sequelize.define('Chapter', {
  id:{
    type:DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    primaryKey:true
  },
    chapterName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    summary: {
        type: DataTypes.STRING,
    },
    chapterImage: {
        type: DataTypes.STRING,
    },
    readingTime: {
        type: DataTypes.STRING,
    },
    pdf: {
        type: DataTypes.STRING,
    },
    moduleId: {
      type: DataTypes.UUID,  
      allowNull: false
    }
});

export default Chapter;