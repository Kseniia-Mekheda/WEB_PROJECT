import { useState } from 'react'; 
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import authService from '../../services/auth';

const Login = () => {
    const [userData, setUserData] = useState({
        email: '', 
        password: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState(false); 
    const { email, password } = userData;
    const navigate = useNavigate();

    const onFieldChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    }; 

    const onSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(false);

        try {
            const data = await authService.login(userData);
            setMessage(data.message);
            navigate('/profile');
        } catch (error) {
            setMessage(error.message);
            setError(true);
        }
    };

    return(
            <Paper
                elevation={0}
                sx={{
                width: '100%',
                maxWidth: 420,
                p: 4,
                borderRadius: 3,
                border: '1px solid',
                    borderColor: 'divider',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(6px)'
                }}
            >
                <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
                    Login
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    Enter your credentials to access your dashboard.
                </Typography>

                <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={onFieldChange}
                    required
                    fullWidth
                    autoComplete="email"
                    InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                        <EmailIcon fontSize="small" color="action" />
                        </InputAdornment>
                    )
                    }}
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={onFieldChange}
                    required
                    fullWidth
                    autoComplete="current-password"
                    inputProps={{ minLength: 8 }}
                    InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                        <LockIcon fontSize="small" color="action" />
                        </InputAdornment>
                    )
                    }}
                />

                    <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ mt: 1, py: 1.15, borderRadius: 2 }}
                    >
                    Log In
                    </Button>
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/signup" underline="hover">
                    Sign up
                    </Link>
                </Typography>
                </Box>

                {message && (
                <Alert
                    severity={error ? 'error' : 'success'}
                    variant="outlined"
                    sx={{ mt: 3 }}
                    onClose={() => setMessage('')}
                >
                    {message}
                </Alert>
                )}
            </Paper>
    )
}
export default Login;