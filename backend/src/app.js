require('dotenv').config();
require('../module-aliases');
const express = require('express');
const serverSetup = require('./initialization/serverSetup');
const app = express();

const startServer = async () => {
    try {
        await serverSetup(app); 
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();