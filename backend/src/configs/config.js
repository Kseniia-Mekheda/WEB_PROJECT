const config = {
    MONGO_URL: process.env.MONGO_URL, 
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    CLIENT_URL: process.env.CLIENT_URL, 
    BACKEND_URL: process.env.BACKEND_URL,
    CLIENT_PORT: process.env.CLIENT_PORT,
    BACKEND_PORT: process.env.BACKEND_PORT,
    MONGO_PORT: process.env.MONGO_PORT, 
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT
};

module.exports = { config };