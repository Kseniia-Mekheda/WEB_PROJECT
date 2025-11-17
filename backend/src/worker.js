require('dotenv').config();
require('../module-aliases');

const { Worker } = require('bullmq');
const { config } = require('./configs/config');

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
};

console.log('Worker connecting to Redis at', connection);

const worker = new Worker('task-queue', async (job) => {
    console.log(`[Worker ${worker.id}] Processing job #${job.id} with data:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await job.updateProgress(50);
    await new Promise(resolve => setTimeout(resolve, 5000));
    const result = `Job #${job.id} completed!`;
    console.log(`[Worker ${worker.id}] ${result}`);

    return result;
}, { connection });

worker.on('completed', (job) => {
  console.log(`[Worker ${worker.id}] Job ${job.id} has completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker ${worker.id}] Job ${job.id} has failed with ${err.message}`);
});