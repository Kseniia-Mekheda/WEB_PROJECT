const { Queue } = require('bullmq');
const { config } = require('~/configs/config');
const task = require('../models/task');

const connection = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
};

const taskQueue = new Queue('taskQueue', { connection }); 

const addTaskToQueue = async (taskData) => {
    const job = await taskQueue.add('calculateTask', taskData);
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
    if (job && (await job.isWaiting() || await job.isActive())) {
        await job.remove();
        return true;
    }
    return false;
}; 

module.exports = {
    taskQueue,
    addTaskToQueue,
    getJobStatus,
    cancelJob
};
