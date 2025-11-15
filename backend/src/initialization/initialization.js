const express = require('express'); 
const cors = require('cors'); 
const cookieParser = require('cookie-parser');
const router = require('~/routes');

const {
    config: { CLIENT_URL }
} = require('~/configs/config'); 

const appInitialization = (app) => {
    app.use(express.json()); 
    app.use(cors({
        origin: CLIENT_URL,
    })); 
    app.use(cookieParser());
    app.use('/', router); 
}

module.exports = appInitialization;
