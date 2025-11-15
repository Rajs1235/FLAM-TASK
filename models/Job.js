const mongoose = require('mongoose');
const { Schema } = mongoose;

const jobSchema = new Schema({
  id: { 
    type: String, 
    required: [true, 'Job ID is required'], 
    unique: true,
    index: true
  },
  command: { 
    type: String, 
    required: [true, 'Job command is required'] 
  },
  state: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'dead'],
    default: 'pending'
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  max_retries: { 
    type: Number, 
    default: 3 
  },
  base_backoff_seconds: { 
    type: Number, 
    default: 2 
  },
  available_at: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  output: { 
    type: String, 
    default: ''
  },
  error: { 
    type: String, 
    default: ''
  }
}, { 
  timestamps: true
});

jobSchema.index({ state: 1, available_at: 1 });

module.exports = mongoose.model('Job', jobSchema);