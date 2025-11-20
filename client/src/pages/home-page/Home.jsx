import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import routes from '../../consts/routes';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
    return (
            <Paper
                elevation={0}
                sx={{
                width: '100%',
                maxWidth: 640,
                p: { xs: 4, sm: 5 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(6px)'
                }}
            >
                <Typography variant="h3" fontWeight={700} gutterBottom>
                    Welcome
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                    Create an account to start submitting tasks and track progress in real time.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 3, justifyContent: 'center' }}
                >
                    <Button
                    variant="contained"
                    size="large"
                    component={RouterLink}
                    to={routes.signup}
                    sx={{ borderRadius: 2, flex: { xs: 1, sm: '0 0 auto' } }}
                    >
                    Sign Up
                    </Button>
                    <Button
                    variant="outlined"
                    size="large"
                    component={RouterLink}
                    to={routes.login}
                    sx={{ borderRadius: 2, flex: { xs: 1, sm: '0 0 auto' } }}
                    >
                    Log In
                    </Button>
                </Stack>
            </Paper>
    )
}

export default Home;