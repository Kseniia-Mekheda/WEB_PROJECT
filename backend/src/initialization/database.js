const mongoose = require('mongoose'); 
const {
    config: { MONGO_URL }
} = require('~/configs/config');

const databaseInitialization = async () => {
    await mongoose.connect(MONGO_URL);
    console.log('Database connected successfully');
}

module.exports = databaseInitialization;