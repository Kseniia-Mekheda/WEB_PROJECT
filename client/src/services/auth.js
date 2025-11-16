import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL
});

const signup = async (userData) => {
    const { username, email, password } = userData; 
    try {
        const response = await api.post('/auth/signup', {
            username,
            email, 
            password
        }); 

        if (response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
        }

        return response.data;
    } catch (error) {
        throw new Error(error.response.data.message || 'Signup failed');
    }
}; 

const login = async (userData) => {
    const { email, password } = userData; 
    try {
        const response = await api.post('/auth/login', {
            email, 
            password
        }); 

        if (response.data.accessToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
        }

        return response.data; 
    } catch (error) {
        throw new Error(error.response.data.message || 'Login failed');
    }
}; 

const logout = () => {
    localStorage.removeItem('accessToken'); 
}

const authService = {
    signup, 
    login, 
    logout
};

export default authService;