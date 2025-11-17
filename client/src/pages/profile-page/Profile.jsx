import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import authService from "../../services/auth";

const Profile = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await authService.logout(); 
            navigate('/login');

        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return (
        <>
            <h1>Hellooooo</h1>
            <Button variant="contained" color="primary" onClick={handleLogout}>
                Logout
            </Button>
        </>  
    )
}

export default Profile;