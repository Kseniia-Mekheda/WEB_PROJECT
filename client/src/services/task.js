import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

const getAllTasks = async () => {
    try {
        const response = await api.get('/tasks');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
};

const createTask = async (number) => {
    try {
        const response = await api.post('/tasks', { number: Number(number) });
        return response.data; 
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create task');
    }
};

const cancelTask = async (jobId) => {
    try {
        const response = await api.post(`/tasks/${jobId}/cancel`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to cancel task');
    }
};

const taskService =  { getAllTasks, createTask, cancelTask };

export default taskService;