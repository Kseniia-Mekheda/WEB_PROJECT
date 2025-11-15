const User = require('~/models/user'); 
const tokenService = require('./tokens');

const signup = async (userData) => {
    const { username, email, password } = userData; 
    const userExists = await User.findOne({ email }); 
    if (userExists) {
        throw new Error('User already exists');
    }

    const user = await User.create({
        username,
        email, 
        password
    }); 

    const payload = { id: user._id }; 
    const { accessToken, refreshToken } = tokenService.generateToken(payload); 
    
    return {
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email
        }
    };
};

const login = async (userData) => {
    const { email, password } = userData; 
    const user = await User.findOne({ email }).select('+password'); 

    if (user && (await user.comparePassword(password))){
        const payload = { id: user._id }; 
        const { accessToken, refreshToken } = tokenService.generateToken(payload); 

        return {
            accessToken, 
            refreshToken, 
            user: {
                _id: user._id, 
                username: user.username,
                email: user.email, 
            }
        };
    } else {
        throw new Error('Invalid email or password');
    }
};

module.exports = {
    signup, 
    login
}