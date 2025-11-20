const db = require('./database');
const initialization = require('./initialization'); 
const http = require('http');
const {
    config: {BACKEND_PORT}
} = require('~/configs/config');
const { initRealtime } = require('./socket');

const serverSetup = async (app) => {
    await db(); 
    initialization(app); 

    const server = http.createServer(app);
    initRealtime(server);

    server.listen(BACKEND_PORT, () => {
        console.log(`Server is running on port ${BACKEND_PORT}`);
    })
}

module.exports = serverSetup;