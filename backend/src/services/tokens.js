const jwt = require('jsonwebtoken'); 
const {
  config: {
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN
  }
} = require('~/configs/config');

const tokenService = {
    generateToken: (payload) => {
        const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
            expiresIn: JWT_ACCESS_EXPIRES_IN
        });

        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        });

        return  {
            accessToken, 
            refreshToken
        }
    },

    validateToken: (token, secret) => {
        try {
            return jwt.verify(token, secret)
        } catch (error) {
            return null
        }
    }, 

    validateAccessToken: (token) => {
        return tokenService.validateToken(token, JWT_ACCESS_SECRET)
    }, 

    validateRefreshToken: (token) => {
        return tokenService.validateToken(token, JWT_REFRESH_SECRET)
    }
}; 

module.exports = tokenService;
