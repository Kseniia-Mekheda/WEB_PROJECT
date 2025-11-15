const express = require('express');
const router = express.Router(); 
const { signup, login } = require('~/controllers/auth'); 
const { signupRules, loginRules, validate } = require('~/middleware/validations'); 

router.post('/signup', signupRules(), validate, signup); 
router.post('/login', loginRules(), validate, login);

module.exports = router;