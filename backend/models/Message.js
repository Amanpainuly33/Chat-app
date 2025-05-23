const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    default: 'general',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  compressed: {
    type: Boolean,
    default: false
  },
  isFile: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Message', messageSchema); 