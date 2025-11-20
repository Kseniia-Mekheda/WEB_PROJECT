import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
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
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';

import AddIcon from '@mui/icons-material/Add';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import HistoryIcon from '@mui/icons-material/History';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import NumbersIcon from '@mui/icons-material/Numbers';

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
                {
                    jobId: t.jobId,
                    input: t.input,
                    status: t.status,
                    progress: 0,
                    createdAt: t.createdAt,
                    etaMs: res.etaMs || 0
                },
                ...prev
            ]);
            setMessage({
              type: 'success',
              text: res.etaMs
                ? `Task is in queue. Estimated waiting time: ~ ${(res.etaMs/1000).toFixed(1)}s`
                : 'Task started successfully'
            });
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
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #eef2f7 0%, #f8fafc 100%)'
            }}
            >
            <AppBar
                position="sticky"
                elevation={0}
                color="transparent"
                sx={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderBottom: '1px solid',
                borderColor: 'divider'
                }}
            >
                <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }} color='primary'>
                    My Tasks
                </Typography>
                <Tooltip title="Logout">
                    <IconButton color="error" onClick={handleLogout}>
                    <LogoutRounded />
                    </IconButton>
                </Tooltip>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {message && (
                <Alert
                    severity={message.type}
                    sx={{ mb: 3 }}
                    onClose={() => setMessage(null)}
                    variant="outlined"
                >
                    {message.text}
                </Alert>
                )}

                <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'rgba(255,255,255,0.8)'
                }}
                >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                    label="Number"
                    type="number"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    sx={{ maxWidth: '100%', flex: '1 1 auto' }}
                    />
                    <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={createNewTask}
                    sx={{
                        px: 3,
                        borderRadius: 2
                    }}
                    >
                    Create
                    </Button>
                </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        mb: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'rgba(255,255,255,0.8)'
                    }}
                    >
                    <Box
                        sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RocketLaunchIcon color="primary" fontSize="small" />
                        <Typography variant="h6">Active Tasks</Typography>
                        </Box>
                        <Chip size="small" label={activeTasks.length} variant="outlined" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ minHeight: activeTasks.length ? 'auto' : 80 }}>
                        {activeTasks.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            <Typography>No active tasks.</Typography>
                        </Box>
                        ) : (
                        <Stack spacing={2}>
                            {activeTasks.map((task) => (
                            <Card key={task.jobId} variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                                <Box
                                    sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold">
                                    Request: {task.input}
                                    </Typography>
                                    <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
                                </Box>
                                {task.status === 'pending' && task.etaMs ? (
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                                    Approximate start: {(task.etaMs / 1000).toFixed(1)}s
                                    </Typography>
                                ) : null}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.25 }}>
                                    <LinearProgress
                                    variant="determinate"
                                    value={task.progress || 0}
                                    sx={{
                                        flex: 1,
                                        height: 8,
                                        borderRadius: 10,
                                        bgcolor: 'grey.200'
                                    }}
                                    color="secondary"
                                    />
                                    <Typography variant="body2" sx={{ minWidth: 42, textAlign: 'right' }}>
                                    {(task.progress || 0)}%
                                    </Typography>
                                    <Button
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => cancelActive(task.jobId)}
                                    >
                                    Cancel
                                    </Button>
                                </Box>
                                </CardContent>
                            </Card>
                            ))}
                        </Stack>
                        )}
                    </Box>
                    </Paper>

                    <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'rgba(255,255,255,0.8)'
                    }}
                    >
                    <Box
                        sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" fontSize="small" />
                        <Typography variant="h6">Task History</Typography>
                        </Box>
                        <Chip size="small" label={tasks.length} variant="outlined" />
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box
                        sx={{
                        height: 420,
                        overflowY: 'auto',
                        borderRadius: 2,
                        pr: 1
                        }}
                    >
                        {tasks.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                            <Typography>History is empty.</Typography>
                        </Box>
                        ) : (
                        <Stack spacing={2}>
                            {tasks.map((task) => (
                            <Card key={task._id || task.jobId} variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                                <Box
                                    sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold">
                                    Request: {task.input}
                                    </Typography>
                                    <Chip label={task.status} color={getStatusColor(task.status)} size="small" />
                                </Box>

                                <Box
                                    sx={{
                                    display: 'flex',
                                    gap: 2,
                                    mt: 1.25,
                                    fontSize: '0.9rem',
                                    color: 'text.secondary',
                                    flexWrap: 'wrap'
                                    }}
                                >
                                    <span>
                                    Result: <b>{task.result ?? '-'}</b>
                                    </span>
                                    <span>Duration: {task.durationMs ? `${task.durationMs}ms` : '-'}</span>
                                    <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                                </Box>
                                </CardContent>
                            </Card>
                            ))}
                        </Stack>
                        )}
                    </Box>
                    </Paper>
            </Container>
            </Box>
    );
};

export default Profile;