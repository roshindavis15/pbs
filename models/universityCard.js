// universityCard.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UniversityCard = sequelize.define('UniversityCard', {
  id:{
    type:DataTypes.UUID,
    defaultValue:DataTypes.UUIDV4,
    primaryKey:true,
    allowNull: false
  },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    icon: {
        type: DataTypes.STRING,
    },
    image: {
        type: DataTypes.STRING,
    },
    
});

export default UniversityCard;