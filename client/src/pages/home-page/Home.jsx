import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import routes from '../../consts/routes';

const Home = () => {
    return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h5" gutterBottom>
                Welcome to Our Application!
            </Typography>
            <Typography variant="h6" gutterBottom>
                Please sign up or log in to continue.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                component={Link}
                to={routes.signup}
                sx={{ mr: 2 }}
            >
                Sign Up
            </Button>       
            <Button
                variant="outlined"      
                color="primary"
                component={Link}    
                to={routes.login}   
            >
                Log In
            </Button>
        </Box>  
    )
}

export default Home;