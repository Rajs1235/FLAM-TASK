const mongoose = require('mongoose');
const { Schema } = mongoose;

const configSchema = new Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  value: { 
    type: String, 
    required: true 
  }
});

// We change the model name to 'Config' to match the code
module.exports = mongoose.model('Config', configSchema);