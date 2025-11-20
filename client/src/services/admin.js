import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const getOverview = async () => {
  const res = await api.get('/admin/overview');
  return res.data;
};

const getAllTasks = async (status) => {
  const res = await api.get('/admin/tasks', { params: { status } });
  return res.data;
};

const getUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

const cancelTask = async (jobId) => {
  const res = await api.post(`/admin/tasks/${jobId}/cancel`);
  return res.data;
};

export default { getOverview, getAllTasks, getUsers, cancelTask };