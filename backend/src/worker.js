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
  const reportInterval = Math.max(1, Math.floor(number / 10));
  const cancelCheckInterval = Math.max(1, Math.floor(number / 100));
  for (let i = 0; i <= number; ++i) {
    if (isPrime(i)) {
      ++primeCount;
    }

    if (i % reportInterval === 0) {
      const progress = Math.floor((i / number) * 100); 
      await job.updateProgress(progress); 
      console.log(`[Worker] Job #${jobId} progress: ${progress}%`);
    }

    if (i % cancelCheckInterval === 0) {
      const t = await Task.findOne({ jobId }).select('status');
      if (t && t.status === 'cancelled') {
        throw new Error('cancelled');
      }
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
}, { connection, concurrency: parseInt(config.WORKER_CONCURRENCY) || 1 });

worker.on('failed', async (job, err) => {
  const reason = err?.message || '';
  const jobId = job?.id;
  console.error(`[Worker] Job ${jobId} failed with ${reason}`);
  if (jobId) {
    const status = reason === 'cancelled' ? 'cancelled' : 'failed';
    await Task.updateOne({ jobId }, { status });
  }
});