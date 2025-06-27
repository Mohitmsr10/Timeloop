const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    default: 'Neutral',
  },
  chatHistory: [
    {
      role: { type: String, enum: ['user', 'past'], required: true },
      message: { type: String, required: true },
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Journal', journalSchema);
