// chapter.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Chapter = sequelize.define('Chapter', {
  id:{
    type:DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    primaryKey:true
  },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    summary: {
        type: DataTypes.STRING,
    },
    image: {
        type: DataTypes.STRING,
    },
    readingTime: {
        type: DataTypes.STRING,
    },
    pdf: {
        type: DataTypes.STRING,
    },
    moduleId: {
      type: DataTypes.UUID,  // Change this to UUID as well
      allowNull: false
    }
});

export default Chapter;