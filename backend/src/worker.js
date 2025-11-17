require('dotenv').config();
require('../module-aliases');

const { Worker } = require('bullmq');
const { config } = require('./configs/config');
const connectDB = require('~/initialization/database');
const Task = require('~/models/task');

const isPrime = (num) => {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
};

const connection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT
};

connectDB();

console.log('Worker connecting to Redis at', connection);

const worker = new Worker('taskQueue', async (job) => {
  const { number } = job.data;
  const jobId = job.id;
  const startTime = Date.now();

  console.log(`[Worker] Processing job #${jobId}. Input: ${number}`);

  await Task.updateOne({ jobId }, { status: 'processing' });
  let primeCount = 0; 
  const reportInterval = Math.floor(number / 10);
  for (let i = 0; i <= number; ++i) {
    if (isPrime(i)) {
      ++primeCount;
    }

    if (i % reportInterval === 0) {
      const progress = Math.floor((i / number) * 100); 
      await job.updateProgress(progress); 
      console.log(`[Worker] Job #${jobId} progress: ${progress}%`);
    }
  }

  const durationMs = Date.now() - startTime;

  await Task.updateOne({ jobId }, {
    status: 'completed',
    result: primeCount,
    durationMs: durationMs
  });

  console.log(`[Worker] Job #${jobId} completed in ${durationMs}ms. Result: ${primeCount}`);
  return { primeCount, durationMs };
}, { connection });

worker.on('failed', async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
  if (job) {
    await Task.updateOne({ jobId: job.id }, { status: 'failed' });
  }
});