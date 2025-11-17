import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import authService from '../../services/auth';

const Signup = () => {
    const [userData, setUserData] = useState({
        username: '', 
        email: '', 
        password: ''
    });
    const [message, setMessage] = useState(''); 
    const [error, setError] = useState(false); 
    const { username, email, password } = userData; 
    const navigate = useNavigate();

    const onFieldChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    }; 

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(false);

        try {
            const data = await authService.signup(userData);
            setMessage(data.message);
            navigate('/profile');
        } catch (error) {
            setMessage(error.message);
            setError(true);
        }
    };

    return (
        <Box
            component='form'
            onSubmit={onSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
        >
            <Typography variant="h4" component="h1" gutterBottom>
                Signup
            </Typography>
            <TextField
                label="Username"
                name="username"
                value={username}
                onChange={onFieldChange}
                required
                fullWidth
            />
            <TextField
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={onFieldChange}
                required
                fullWidth
            />
            <TextField
                label="Password (min 8 chars)"
                name="password"
                type="password"
                value={password}
                onChange={onFieldChange}
                required
                minLength={8}
                fullWidth
            />

            <Button type="submit" variant="contained" size="large" fullWidth>
                Signup
            </Button>
      
            {message && (
                <Alert severity={error ? 'error' : 'success'} sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}
        </Box>
    )
}

export default Signup; 
