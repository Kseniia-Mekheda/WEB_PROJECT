const { Schema, model, version } = require('mongoose');

const taskSchema = new Schema(
    {
        jobId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
            default: 'pending'
        },
        input: {
            type: Number,
            required: true
        },
        result: {
            type: Number,
        },
        durationMs: {
            type: Number
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
); 

module.exports = model('Task', taskSchema);