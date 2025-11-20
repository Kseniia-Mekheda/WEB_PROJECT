const { Queue } = require('bullmq');
const { config } = require('~/configs/config');
const crypto = require('crypto');

const connection = {
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT)
};
const QUEUE_NAME = 'taskQueue';

const taskQueue = new Queue(QUEUE_NAME, { connection }); 

const addTaskToQueue = async (data) => {
    const uniqueJobId = crypto.randomUUID();
    const job = await taskQueue.add('calculate-primes', data, {
      jobId: uniqueJobId 
    });
    return job;
};

const getJobStatus = async (jobId) => {
    const job = await taskQueue.getJob(jobId);
    if (!job) {
        return null;
    }

    const progress = await job.getProgress();
    const state = await job.getState();

    return {
        id: job.id,
        status: state,
        progress: progress,
        failedReason: job.failedReason
    };
};

const cancelJob = async (jobId) => {
    const job = await taskQueue.getJob(jobId);
    if (!job) return { cancelled: false, wasActive: false };

    const state = await job.getState();

    if (['waiting', 'delayed', 'paused', 'waiting-children'].includes(state)) {
        await job.remove();
        return { cancelled: true, wasActive: false };
    }

    if (state === 'active') {
        return { cancelled: true, wasActive: true };
    }

    return { cancelled: false, wasActive: false };
};

module.exports = {
    taskQueue,
    addTaskToQueue,
    getJobStatus,
    cancelJob,
    QUEUE_NAME
};