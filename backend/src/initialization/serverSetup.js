const db = require('./database');
const initialization = require('./initialization'); 
const {
    config: {BACKEND_PORT}
} = require('~/configs/config');

const serverSetup = async (app) => {
    await db(); 
    initialization(app); 
    app.listen(BACKEND_PORT, () => {
        console.log(`Server is running on port ${BACKEND_PORT}`);
    })
}

module.exports = serverSetup;