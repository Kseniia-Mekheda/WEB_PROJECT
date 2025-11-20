const { WebSocketServer } = require('ws');
const url = require('url');
const tokenService = require('~/services/tokens');
const Task = require('~/models/task');
const { QueueEvents } = require('bullmq');
const { config } = require('~/configs/config');
const { taskQueue } = require('~/services/queue');
const User = require('~/models/user');

const connection = { host: config.REDIS_HOST, port: Number(config.REDIS_PORT) };

const clients = new Map();

const broadcastToUser = (userId, payload) => {
  const set = clients.get(String(userId));
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  }
};

const adminClients = new Set();

const broadcastToAdmins = (payload) => {
  const data = JSON.stringify({ type: 'admin:event', ...payload });
  for (const ws of adminClients) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
};

const initQueueEvents = () => {
  const events = new QueueEvents(taskQueue.name, { connection });

  events.on('active', async ({ jobId }) => {
    try {
      const task = await Task.findOne({ jobId });
      if (!task) return;
      broadcastToUser(task.user, { type: 'task:status', jobId, status: 'processing' });
      broadcastToAdmins({ event: 'active', jobId, user: task.user, status: 'processing' });
    } catch {}
  });

  events.on('progress', async ({ jobId, data }) => {
    try {
      const task = await Task.findOne({ jobId });
      if (!task) return;
      const progress = typeof data === 'number' ? data : data?.progress ?? 0;
      broadcastToUser(task.user, { type: 'task:progress', jobId, progress });
      broadcastToAdmins({ event: 'progress', jobId, progress, user: task.user });
    } catch {}
  });

  events.on('completed', async ({ jobId, returnvalue }) => {
    try {
      const task = await Task.findOne({ jobId });
      if (!task) return;
      broadcastToUser(task.user, { type: 'task:completed', jobId, task });
      broadcastToAdmins({ event: 'completed', jobId, task });
    } catch {}
  });

  events.on('failed', async ({ jobId, failedReason }) => {
    try {
      const task = await Task.findOne({ jobId });
      if (!task) return;
      const status = (failedReason || '').toLowerCase().includes('cancelled') ? 'cancelled' : 'failed';
      broadcastToUser(task.user, { type: 'task:status', jobId, status });
      broadcastToAdmins({ event: 'failed', jobId, status, reason: failedReason, user: task.user });
    } catch {}
  });

  events.on('error', (err) => {
    console.error('[QueueEvents] error', err);
  });
};

const initRealtime = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  initQueueEvents();

  wss.on('connection', async (ws, req) => {
    const { query } = url.parse(req.url, true);
    const token = query?.token || (req.headers['sec-websocket-protocol'] || '').replace('Bearer ', '');

    const decoded = token && tokenService.validateAccessToken(token);
    if (!decoded?.id) {
      ws.close(4401, 'Unauthorized');
      return;
    }

    const userId = String(decoded.id);
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);

    try {
      const userDoc = await User.findById(decoded.id).select('isSuperUser');
      if (userDoc?.isSuperUser) {
        adminClients.add(ws);
      }
    } catch (e) {
      console.error('WS user fetch error:', e);
    }

    ws.on('close', () => {
      const set = clients.get(userId);
      if (!set) return;
      set.delete(ws);
      if (set.size === 0) clients.delete(userId);
      adminClients.delete(ws);
    });

    ws.on('error', () => {});
    ws.send(JSON.stringify({ type: 'hello', userId }));
  });

  console.log('WebSocket realtime initialized at /ws');
};

module.exports = { initRealtime, broadcastToUser };