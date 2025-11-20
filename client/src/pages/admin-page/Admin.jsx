import { useEffect, useState, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import adminService from '../../services/admin';

const wsUrlFromApi = (apiUrl) => {
  try {
    const u = new URL(apiUrl);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.pathname = '/ws';
    u.search = `token=${localStorage.getItem('accessToken') || ''}`;
    return u.toString();
  } catch {
    return '';
  }
};

const statusColor = (s) => {
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'error';
  if (s === 'cancelled') return 'warning';
  return 'primary';
};

const AdminPanel = () => {
  const [overview, setOverview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const WS_URL = useMemo(() => wsUrlFromApi(API_URL), [API_URL]);
  const wsRef = useRef(null);
  const user = localStorage.getItem('currentUser');

  useEffect(() => {
    (async () => {
      try {
      const o = await adminService.getOverview();
      setOverview(o);
      const t = await adminService.getAllTasks(filterStatus || undefined);
      setTasks(t.tasks);
      } catch (e) {
      setMessage({ type: 'error', text: e.message });
      }
    })();
  }, [filterStatus]);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'admin:event') {
          if (['progress','active'].includes(msg.event)) {
            setTasks(prev => prev.map(t => t.jobId === msg.jobId
              ? { ...t, status: msg.event === 'active' ? 'processing' : t.status, progress: msg.progress ?? t.progress }
              : t));
          } else if (msg.event === 'completed' && msg.task) {
            setTasks(prev => {
              const exists = prev.some(x => x.jobId === msg.jobId);
              return exists
                ? prev.map(x => x.jobId === msg.jobId ? msg.task : x)
                : [msg.task, ...prev];
            });
          } else if (msg.event === 'failed') {
            setTasks(prev => prev.map(t => t.jobId === msg.jobId ? { ...t, status: msg.status } : t));
          }
        }
      } catch (error) {
        console.error(error.message);
      }
    }
    return () => {
      try { ws.close(); } catch (error) { console.error(error.message); }
      wsRef.current = null;
    };
  }, [WS_URL]);

  const refreshOverview = async () => {
    try {
      const o = await adminService.getOverview();
      setOverview(o);
    } catch (error) {
        console.error(error.message);
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await adminService.cancelTask(jobId);
      setTasks(prev => prev.map(t => t.jobId === jobId ? { ...t, status: 'cancelled' } : t));
      setMessage({ type: 'info', text: 'Task cancelled' });
      const o = await adminService.getOverview();
      setOverview(o);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  return (
    <>
      {!user.isSuperUser ? (
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: 2 }}>
          <Typography variant="h1" gutterBottom>403 Forbidden</Typography>
        </Box>
        ) : (
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: 2 }}>
          <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb:2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', mb:3 }}>
            <Card sx={{ flex:1, minWidth:250 }}>
              <CardContent>
                <Typography variant="h6">Queue</Typography>
                {overview && (
                  <Box sx={{ fontSize:13 }}>
                    <div>waiting: {overview.queue.waiting}</div>
                    <div>active: {overview.queue.active}</div>
                    <div>completed: {overview.queue.completed}</div>
                    <div>failed: {overview.queue.failed}</div>
                    <div>delayed: {overview.queue.delayed}</div>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Card sx={{ flex:1, minWidth:250 }}>
              <CardContent>
                <Typography variant="h6">Tasks</Typography>
                {overview && (
                  <Box sx={{ fontSize:13 }}>
                    <div>total: {overview.tasks.total}</div>
                    <div>active: {overview.tasks.active}</div>
                    <div>completed: {overview.tasks.completed}</div>
                    <div>failed: {overview.tasks.failed}</div>
                    <div>cancelled: {overview.tasks.cancelled}</div>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Card sx={{ flex:1, minWidth:250 }}>
              <CardContent>
                <Typography variant="h6">System</Typography>
                {overview && (
                  <Box sx={{ fontSize:13 }}>
                    <div>loadAvg: {overview.system.loadAvg.map(n=>n.toFixed(2)).join(', ')}</div>
                    <div>freeMem: {(overview.system.freeMem/1e6).toFixed(1)} MB</div>
                    <div>heapUsed: {(overview.system.heapUsed/1e6).toFixed(1)} MB</div>
                    <div>procUptime: {Math.floor(overview.system.processUptimeSec)} s</div>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Card sx={{ flexBasis:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', p:2 }}>
              <Select size="small" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="pending">pending</MenuItem>
                <MenuItem value="processing">processing</MenuItem>
                <MenuItem value="completed">completed</MenuItem>
                <MenuItem value="failed">failed</MenuItem>
                <MenuItem value="cancelled">cancelled</MenuItem>
              </Select>
              <Chip label="Refresh" onClick={refreshOverview} variant="outlined" />
            </Card>
          </Box>

          <Typography variant="h6" gutterBottom>Tasks</Typography>
          <Stack spacing={1}>
            {tasks.map(t => (
              <Card key={t.jobId}>
                <CardContent sx={{ py:1 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                    <Typography fontWeight="bold">Input: {t.input}</Typography>
                    <Chip label={t.status} color={statusColor(t.status)} size="small" />
                  </Box>
                  <Box sx={{ fontSize:12, mt:1, display:'flex', gap:2, flexWrap:'wrap' }}>
                    <span>User: {t.user?.username || 'n/a'}</span>
                    <span>Email: {t.user?.email || '-'}</span>
                    <span>Result: {t.result ?? '-'}</span>
                    <span>Duration: {t.durationMs ? `${t.durationMs}ms` : '-'}</span>
                    <span>Created: {new Date(t.createdAt).toLocaleString()}</span>
                  </Box>
                  {['pending','processing'].includes(t.status) && (
                    <Box sx={{ mt:1, display:'flex', alignItems:'center', gap:1 }}>
                      <LinearProgress variant="determinate" value={t.progress || 0} sx={{ flex:1 }} />
                      <Typography variant="caption">{t.progress || 0}%</Typography>
                      <Button
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={()=>handleCancel(t.jobId)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
      </Box>
      )} 
    </>
  );
};

export default AdminPanel;