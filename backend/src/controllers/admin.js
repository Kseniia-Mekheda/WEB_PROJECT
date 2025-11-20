const os = require('os');
const Task = require('~/models/task');
const User = require('~/models/user');
const { taskQueue } = require('~/services/queue');
const queueService = require('~/services/queue');

const getOverview = async (req, res) => {
    try {
        const jobCounts = await taskQueue.getJobCounts();
        const totalTasks = await Task.countDocuments();
        const activeTasks = await Task.countDocuments({ status: { $in: ['pending','processing'] } });
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const failedTasks = await Task.countDocuments({ status: 'failed' });
        const cancelledTasks = await Task.countDocuments({ status: 'cancelled' });

        const mem = process.memoryUsage();
        const overview = {
            queue: jobCounts,
            tasks: {
                total: totalTasks,
                active: activeTasks,
                completed: completedTasks,
                failed: failedTasks,
                cancelled: cancelledTasks
            },
            system: {
                loadAvg: os.loadavg(),      
                freeMem: os.freemem(),
                totalMem: os.totalmem(),
                uptimeSec: os.uptime(),
                processUptimeSec: process.uptime(),
                rss: mem.rss,
                heapTotal: mem.heapTotal,
                heapUsed: mem.heapUsed
            },
            timestamp: Date.now()
        };
        res.json(overview);
    } catch (e) {
        res.status(500).json({ message: 'Failed to load overview' });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const tasks = await Task.find(filter).populate('user','username email isSuperUser').sort({ createdAt: -1 });
        res.json({ tasks });
    } catch {
        res.status(500).json({ message: 'Failed to load tasks' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('username email isSuperUser createdAt');
        res.json({ users });
    } catch {
        res.status(500).json({ message: 'Failed to load users' });
    }
};

const cancelTaskAdmin = async (req, res) => {
    const { jobId } = req.params;
    try {
        const task = await Task.findOne({ jobId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (['completed','failed','cancelled'].includes(task.status)) {
            return res.status(400).json({ message: 'Task already finished' });
        }
        const { cancelled } = await queueService.cancelJob(jobId);
        if (!cancelled) {
            return res.status(404).json({ message: 'Task not in queue or already completed' });
        }
        task.status = 'cancelled';
        await task.save();
        return res.status(200).json({ message: 'Task cancelled by admin', task });
    } catch (e) {
        return res.status(500).json({ message: 'Failed to cancel task' });
    }
};

module.exports = {
    getOverview,
    getAllTasks,
    getUsers,
    cancelTaskAdmin
};