const math = require('mathjs');

// Parse a chemical formula into an object of elements and their counts
const parseFormula = (formula) => {
  const elements = {};
  let currentElement = '';
  let currentCount = '';
  let i = 0;
  
  while (i < formula.length) {
    const char = formula[i];
    
    if (char === '(') {
      let subgroup = '';
      let depth = 1;
      i++;
      
      while (depth > 0 && i < formula.length) {
        if (formula[i] === '(') depth++;
        if (formula[i] === ')') depth--;
        
        if (depth > 0) {
          subgroup += formula[i];
        }
        i++;
      }
      
      let multiplier = '';
      while (i < formula.length && /[0-9]/.test(formula[i])) {
        multiplier += formula[i];
        i++;
      }
      multiplier = multiplier ? parseInt(multiplier) : 1;
      
      const subElements = parseFormula(subgroup);
      for (const element in subElements) {
        elements[element] = (elements[element] || 0) + subElements[element] * multiplier;
      }
    } else if (char >= 'A' && char <= 'Z') {
      if (currentElement) {
        const count = currentCount ? parseInt(currentCount) : 1;
        elements[currentElement] = (elements[currentElement] || 0) + count;
        currentElement = '';
        currentCount = '';
      }
      
      currentElement = char;
      i++;
      
      while (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') {
        currentElement += formula[i];
        i++;
      }
    } else if (char >= '0' && char <= '9') {
      currentCount += char;
      i++;
    } else {
      i++;
    }
  }
  
  if (currentElement) {
    const count = currentCount ? parseInt(currentCount) : 1;
    elements[currentElement] = (elements[currentElement] || 0) + count;
  }
  
  return elements;
};

// Find the Greatest Common Divisor of an array of numbers
const findGCD = (numbers) => {
  const gcd = (a, b) => {
    // Convert BigInt or number to number for compatibility
    a = Number(a);
    b = Number(b);
    a = Math.abs(a);
    b = Math.abs(b);
    if (b === 0) return a;
    return gcd(b, a % b);
  };
  
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = gcd(result, numbers[i]);
  }
  return Math.abs(result);
};

// Find the Least Common Multiple of an array of numbers
const findLCM = (numbers) => {
  const lcm = (a, b) => {
    // Convert BigInt or number to number for compatibility
    a = Number(a);
    b = Number(b);
    return Math.abs(a * b) / findGCD([a, b]);
  };
  
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++) {
    result = lcm(result, numbers[i]);
  }
  return Math.abs(result);
};

// Solve the system of linear equations using Gaussian elimination
const solveLinearSystem = (matrix, elementsCount) => {
  const augmentedMatrix = matrix.map(row => [...row, 0]);
  const n = augmentedMatrix[0].length - 1; // Number of variables
  const m = augmentedMatrix.length; // Number of equations
  
  // Forward elimination
  let rank = 0;
  for (let col = 0; col < n && rank < m; col++) {
    let pivotRow = rank;
    for (let row = rank + 1; row < m; row++) {
      if (Math.abs(augmentedMatrix[row][col]) > Math.abs(augmentedMatrix[pivotRow][col])) {
        pivotRow = row;
      }
    }
    
    if (Math.abs(augmentedMatrix[pivotRow][col]) < 1e-10) {
      continue;
    }
    
    if (pivotRow !== rank) {
      [augmentedMatrix[rank], augmentedMatrix[pivotRow]] = [augmentedMatrix[pivotRow], augmentedMatrix[rank]];
    }
    
    const pivot = augmentedMatrix[rank][col];
    for (let j = col; j <= n; j++) {
      augmentedMatrix[rank][j] /= pivot;
    }
    
    for (let row = 0; row < m; row++) {
      if (row !== rank && Math.abs(augmentedMatrix[row][col]) > 1e-10) {
        const factor = augmentedMatrix[row][col];
        for (let j = col; j <= n; j++) {
          augmentedMatrix[row][j] -= factor * augmentedMatrix[rank][j];
        }
      }
    }
    
    rank++;
  }
  
  // Check consistency
  for (let row = rank; row < m; row++) {
    if (Math.abs(augmentedMatrix[row][n]) > 1e-10) {
      throw new Error("System has no solution");
    }
  }
  
  // Extract solutions
  const solution = new Array(n).fill(0);
  const freeVars = new Array(n).fill(false);
  
  // Identify free variables
  let row = 0;
  for (let col = 0; col < n; col++) {
    if (row < rank && Math.abs(augmentedMatrix[row][col] - 1) < 1e-10) {
      solution[col] = augmentedMatrix[row][n];
      row++;
    } else {
      freeVars[col] = true;
      solution[col] = 1; // Assign 1 to free variables
    }
  }
  
  // Back-substitute to solve for dependent variables
  for (let r = rank - 1; r >= 0; r--) {
    let pivotCol = -1;
    for (let col = 0; col < n; col++) {
      if (Math.abs(augmentedMatrix[r][col] - 1) < 1e-10) {
        pivotCol = col;
        break;
      }
    }
    if (pivotCol === -1) continue;
    
    let sum = 0;
    for (let col = pivotCol + 1; col < n; col++) {
      sum += augmentedMatrix[r][col] * solution[col];
    }
    solution[pivotCol] = -sum;
  }
  
  // Convert to positive integers
  const fractions = solution.map(val => {
    const frac = math.fraction(val);
    return { n: Number(frac.n), d: Number(frac.d) }; // Convert BigInt to Number
  });
  const denominators = fractions.map(f => f.d).filter(d => d !== 0);
  const lcm = denominators.length > 0 ? findLCM(denominators) : 1;
  
  // Multiply by LCM to get integers
  const intSolution = solution.map(val => Math.round(val * lcm));
  
  // Ensure positive coefficients
  const minCoeff = Math.min(...intSolution);
  if (minCoeff <= 0) {
    const offset = Math.abs(minCoeff) + 1;
    for (let i = 0; i < n; i++) {
      intSolution[i] += offset;
    }
  }
  
  // Simplify using GCD
  const gcd = findGCD(intSolution.filter(val => val !== 0));
  for (let i = 0; i < n; i++) {
    intSolution[i] = Math.round(intSolution[i] / gcd);
  }
  
  return intSolution;
};

// Balance a chemical equation
const balanceEquation = (equation) => {
  try {
    const [reactantsStr, productsStr] = equation.split('->').map(side => side.trim());
    const reactants = reactantsStr.split('+').map(r => r.trim());
    const products = productsStr.split('+').map(p => p.trim());
    
    const allElements = new Set();
    const moleculesElements = {};
    
    for (const molecule of [...reactants, ...products]) {
      moleculesElements[molecule] = parseFormula(molecule);
      Object.keys(moleculesElements[molecule]).forEach(element => allElements.add(element));
    }
    
    const elementsArray = Array.from(allElements);
    const n = reactants.length + products.length;
    const matrix = [];
    
    for (const element of elementsArray) {
      const row = Array(n).fill(0);
      
      for (let i = 0; i < reactants.length; i++) {
        if (moleculesElements[reactants[i]][element]) {
          row[i] = moleculesElements[reactants[i]][element];
        }
      }
      
      for (let i = 0; i < products.length; i++) {
        if (moleculesElements[products[i]][element]) {
          row[i + reactants.length] = -moleculesElements[products[i]][element];
        }
      }
      
      matrix.push(row);
    }
    
    const coefficients = solveLinearSystem(matrix, elementsArray.length);
    
    const reactantCoefficients = coefficients.slice(0, reactants.length);
    const productCoefficients = coefficients.slice(reactants.length);
    
    const balancedReactants = reactants.map((r, i) => 
      reactantCoefficients[i] === 1 ? r : `${reactantCoefficients[i]}${r}`);
    const balancedProducts = products.map((p, i) => 
      productCoefficients[i] === 1 ? p : `${productCoefficients[i]}${p}`);
    
    const balancedEquation = `${balancedReactants.join(' + ')} -> ${balancedProducts.join(' + ')}`;
    
    return {
      balancedEquation,
      reactants,
      products,
      reactantCoefficients,
      productCoefficients
    };
  } catch (error) {
    console.error('Error balancing equation:', error);
    throw new Error('Could not balance the equation. Please check your input.');
  }
};

module.exports = { balanceEquation, parseFormula };