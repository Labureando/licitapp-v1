import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  appName: process.env.APP_NAME || 'licitapp',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    name: process.env.DB_NAME || 'licitapp',
    synchronize: process.env.NODE_ENV !== 'production',
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',

  // API
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: process.env.API_PREFIX || 'api',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
};

export default config;
