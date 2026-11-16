const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from backend root, fallback to default cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
    NODE_ENV: process.env.NODE_ENV || 'development',
};
