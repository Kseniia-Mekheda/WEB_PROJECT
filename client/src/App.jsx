import { Routes, Route } from 'react-router-dom';
import Container from '@mui/material/Container';
import Login from './pages/login-page/Login';
import Signup from './pages/signup-page/Signup';
import Profile from './pages/profile-page/Profile';
import Home from './pages/home-page/Home';
import Admin from './pages/admin-page/Admin';
import './App.css'

function App() {
  return (
    <Container>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Container>
  )
}

export default App;
