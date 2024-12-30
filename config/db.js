import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.CONNECTION_STRING

const sequelize = new Sequelize(connectionString,{
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully!');
    return true;
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('Full error:', {
      name: error.name,
      code: error.original?.code,
      errno: error.original?.errno
    });
    return false;
  }
};

testConnection();

export default sequelize;