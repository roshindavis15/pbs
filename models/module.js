// module.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Module = sequelize.define('Module', {
  id:{
    type:DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    primaryKey:true
  },
    moduleName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    moduleImage: {
        type: DataTypes.STRING,
    },
    verticalId: {
      type: DataTypes.UUID,  
      allowNull: false
    }
});

export default Module;