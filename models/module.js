// module.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Module = sequelize.define('Module', {
  id:{
    type:DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    primaryKey:true
  },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
    },
    universityCardId: {
      type: DataTypes.UUID,  // Change this to UUID as well
      allowNull: false
    }
});

export default Module;