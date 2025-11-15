const config = {
    MONGO_URL: process.env.MONGO_URL, 
    SECRET_KEY: process.env.SECRET_KEY,
    CLIENT_URL: process.env.CLIENT_URL, 
    BACKEND_URL: process.env.BACKEND_URL,
    CLIENT_PORT: process.env.CLIENT_PORT,
    BACKEND_PORT: process.env.BACKEND_PORT,
    MONGO_PORT: process.env.MONGO_PORT
};

module.exports = { config };