const authService = require('~/services/auth'); 
const cookieOptions = {
    httpOnly: true, 
    maxAge: 30 * 24 * 60 * 60 * 1000
}; 

const signup = async (req, res) => {
    try {
        const { user, accessToken, refreshToken } = await authService.signup(req.body); 
        res.cookie('refreshToken', refreshToken, cookieOptions); 
        res.status(201).json({
            user, 
            accessToken
        });
    } catch (error) {
        const code = error.message === 'User already exists' ? 400 : 500; 
        res.status(code).json({ message: error.message }); 
    }
}; 

const login = async (req, res) => {
    try {
        const { user, accessToken, refreshToken } = await authService.login(req.body);
        res.cookie('refreshToken', refreshToken, cookieOptions); 
        res.status(200).json({
            user, 
            accessToken
        }); 
    } catch (error) {
        const code = error.message === 'Invalid email or password' ? 401 : 500; 
        res.status(code).json({ message: error.message});
    }
}; 

module.exports = {
    signup, 
    login
}