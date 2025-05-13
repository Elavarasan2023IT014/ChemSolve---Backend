const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SolvedEquation = require('../models/SolvedEquation');
const { balanceEquation } = require('../utils/balanceEquation');
const { generateMoleculeData } = require('../utils/generateMolecule');

// @route   POST /api/equations/solve
// @desc    Solve and balance a chemical equation
// @access  Private
router.post('/solve', protect, async (req, res) => {
  try {
    const { equation } = req.body;
    
    if (!equation) {
      return res.status(400).json({ message: 'Please provide a chemical equation' });
    }
    
    // Balance the equation
    const balancedData = balanceEquation(equation);
    
    // Generate molecule data for all compounds
    const molecules = [...balancedData.reactants, ...balancedData.products];
    const moleculeDataPromises = molecules.map(molecule => generateMoleculeData(molecule));
    const moleculeData = await Promise.all(moleculeDataPromises);
    
    // Create a map of molecule data
    const moleculeDataMap = {};
    molecules.forEach((molecule, index) => {
      moleculeDataMap[molecule] = moleculeData[index];
    });
    
    // Save the solved equation to the database
    const solvedEquation = await SolvedEquation.create({
      user: req.user._id,
      inputEquation: equation,
      balancedEquation: balancedData.balancedEquation,
      molecules,
      moleculeData: moleculeDataMap
    });
    
    res.status(201).json({
      _id: solvedEquation._id,
      inputEquation: solvedEquation.inputEquation,
      balancedEquation: solvedEquation.balancedEquation,
      molecules: solvedEquation.molecules,
      moleculeData: solvedEquation.moleculeData,
      createdAt: solvedEquation.createdAt
    });
  } catch (error) {
    console.error(`Error solving equation: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/equations/history
// @desc    Get user's history of solved equations
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const equations = await SolvedEquation.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(equations);
  } catch (error) {
    console.error(`Error fetching equation history: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/equations/:id
// @desc    Get a specific solved equation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const equation = await SolvedEquation.findById(req.params.id);
    
    if (!equation) {
      return res.status(404).json({ message: 'Equation not found' });
    }
    
    // Check if the equation belongs to the user
    if (equation.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to access this equation' });
    }
    
    res.json(equation);
  } catch (error) {
    console.error(`Error fetching equation: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/equations/:id
// @desc    Delete a solved equation
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const equation = await SolvedEquation.findById(req.params.id);
    
    if (!equation) {
      return res.status(404).json({ message: 'Equation not found' });
    }
    
    // Check if the equation belongs to the user
    if (equation.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to delete this equation' });
    }
    
    await equation.deleteOne(); // Updated from .remove() to .deleteOne()
    res.json({ message: 'Equation removed' });
  } catch (error) {
    console.error(`Error deleting equation: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;