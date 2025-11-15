const { Schema, model } = require('mongoose')

const userSchema = new Schema(
    {
        username: {
            type: String, 
            required: true, 
            minLength: 1, 
            maxLength: 30
        }, 
        email: {
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true
        }, 
        password: {
            type: String, 
            required: true, 
            minLength: 8, 
            select: false
        }
    }, 
    {
        versionKey: false, 
        id: false
    }
)

module.exports = model('User', userSchema); 