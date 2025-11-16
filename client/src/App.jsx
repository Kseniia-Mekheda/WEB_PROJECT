import { Routes, Route, Link } from 'react-router-dom';
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Login from './pages/login-page/Login';
import Signup from './pages/signup-page/Signup';
import Profile from './pages/profile-page/Profile';
import './App.css'

function App() {
  return (
    <Box>
      <Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Welcome to my app
        </Typography>
        <Button color="inherit" component={Link} to="/login">
          LogIn
        </Button>
        <Button color="inherit" component={Link} to="/signup">
          SignUp
        </Button>
      </Box>

      <Container>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App;
