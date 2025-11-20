import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';

import authService from '../../services/auth';
import taskService from '../../services/task';

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

const Profile = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null)
    const [activeTasks, setActiveTasks] = useState([]);
    const [input, setInput] = useState('');
    const wsRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL;
    const WS_URL = useMemo(() => wsUrlFromApi(API_URL), [API_URL]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await taskService.getAllTasks();
                setTasks(data.tasks);
            } catch (error) {
                console.error("Load error:", error);
                if (error.message.includes('401') || error.message.includes('auth')) {
                    authService.logout();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [navigate]);

    useEffect(() => {
        if (!WS_URL) return;
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {};
        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.type === 'task:progress') {
                    setActiveTasks((prev) => prev.map(t => t.jobId === msg.jobId ? { ...t, progress: msg.progress, status: 'processing' } : t));
                } else if (msg.type === 'task:status') {
                    if (msg.status === 'processing') {
                        setActiveTasks((prev) => prev.map(t => t.jobId === msg.jobId ? { ...t, status: 'processing' } : t));
                    } else if (msg.status === 'cancelled' || msg.status === 'failed') {
                        setActiveTasks((prev) => prev.filter(t => t.jobId !== msg.jobId));
                        taskService.getAllTasks().then(d => setTasks(d.tasks)).catch(() => {});
                    }
                } else if (msg.type === 'task:completed') {
                    setActiveTasks((prev) => prev.filter(t => t.jobId !== msg.jobId));
                    if (msg.task) {
                        setTasks((prev) => {
                            const exists = prev.some(t => t.jobId === msg.task.jobId);
                            return exists ? prev : [msg.task, ...prev];
                        });
                    } else {
                        taskService.getAllTasks().then(d => setTasks(d.tasks)).catch(() => {});
                    }
                }
            } catch (error) {
                console.log('Error ', error.message)
            }
        };
        ws.onclose = () => { wsRef.current = null; };
        ws.onerror = () => {};

        return () => {
            try { ws.close(); } catch (error) { console.log (error.message) }
            wsRef.current = null;
        };
    }, [WS_URL]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return 'success';
        if (status === 'failed') return 'error';
        if (status === 'cancelled') return 'warning';
        return 'primary';
    };

    const createNewTask = async () => {
        const value = Number(input);
        if (!value || value <= 0) return;
        try {
            const res = await taskService.createTask(value);
            const t = res.task;
            setActiveTasks((prev) => [
                { jobId: t.jobId, input: t.input, status: t.status, progress: 0, createdAt: t.createdAt },
                ...prev
            ]);
            setMessage({ type: 'success', text: 'Task started successfully' });
            setInput('');
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const cancelActive = async (jobId) => {
        try {
            await taskService.cancelTask(jobId);
            setActiveTasks((prev) => prev.filter(t => t.jobId !== jobId));
            const data = await taskService.getAllTasks();
            setTasks(data.tasks);
            setMessage({ type: 'info', text: 'Task cancelled' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    if (loading) return <Box sx={{p:4, textAlign:'center'}}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: '900px', margin: '0 auto', p: 2 }}>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">My Tasks</Typography>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                    Logout
                </Button>
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <TextField
                    label="Number"
                    type="number"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    sx={{ maxWidth: 300 }}
                />
                <Button variant="contained" onClick={createNewTask}>
                    Create
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom>Active Tasks</Typography>
            <Box sx={{ 
                minHeight: activeTasks.length ? 'auto' : 80,
                mb: 4
            }}>
                {activeTasks.length === 0 ? (
                    <Typography sx={{ color: 'gray' }}>No active tasks.</Typography>
                ) : (
                    <Stack spacing={2}>
                        {activeTasks.map((task) => (
                            <Card key={task.jobId} variant="outlined">
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Request: {task.input}
                                        </Typography>
                                        <Chip 
                                            label={task.status} 
                                            color={getStatusColor(task.status)} 
                                            size="small" 
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                        <LinearProgress variant="determinate" value={task.progress || 0} sx={{ flex: 1 }} />
                                        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                                            {(task.progress || 0)}%
                                        </Typography>
                                        <Button size="small" color="warning" variant="outlined" onClick={() => cancelActive(task.jobId)}>
                                            Cancel
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>

            <Typography variant="h6" gutterBottom>Task History</Typography>
            
            <Box sx={{ 
                height: '400px', 
                overflowY: 'auto', 
                border: '1px solid #ddd',
                borderRadius: 2,
                p: 2,
                backgroundColor: '#fafafa'
            }}>
                {tasks.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', mt: 5, color: 'gray' }}>
                        History is empty.
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {tasks.map((task) => (
                            <Card key={task._id || task.jobId} variant="outlined">
                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Request: {task.input}
                                        </Typography>
                                        <Chip 
                                            label={task.status} 
                                            color={getStatusColor(task.status)} 
                                            size="small" 
                                        />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 2, mt: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                                        <span>Result: <b>{task.result ?? '-'}</b></span>
                                        <span>Duration: {task.durationMs ? `${task.durationMs}ms` : '-'}</span>
                                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default Profile;