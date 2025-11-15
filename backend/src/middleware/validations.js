const { body, validationResult } = require('express-validator');

const signupRules = () => [
    body('username', 'Username is required').notEmpty().isLength({ min: 1, max: 30 }), 
    body('email', 'Valid email is required').notEmpty().normalizeEmail(), 
    body('password', 'Password must be longer then 8 characters').notEmpty().isLength({ min: 8})
]; 

const loginRules = () => [
    body('email', 'Valid email is required').notEmpty().normalizeEmail(),
    body('password', 'Password is required').exists()
]; 

const validate = (req, res, next) => {
    const errors = validationResult(req); 
    if (errors.isEmpty()){
        return next();
    }

    return res.status(400).json({ errors: errors.array() });
};

module.exports = {
    signupRules,
    loginRules,
    validate
}