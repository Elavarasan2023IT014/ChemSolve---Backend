const mongoose = require('mongoose');

const SolvedEquationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputEquation: {
    type: String,
    required: true,
    trim: true
  },
  balancedEquation: {
    type: String,
    required: true,
    trim: true
  },
  molecules: {
    type: [String], // Store molecule formulas
    required: true
  },
  moleculeData: {
    type: Object, // Store molecule visualization data
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SolvedEquation', SolvedEquationSchema);