const axios = require('axios');
const { parseFormula } = require('./balanceEquation');

// Element properties for visualization
const ELEMENT_PROPERTIES = {
  H: { color: '#FFFFFF', radius: 0.31, mass: 1.008 },
  He: { color: '#D9FFFF', radius: 0.28, mass: 4.0026 },
  Li: { color: '#CC80FF', radius: 1.28, mass: 6.94 },
  Be: { color: '#C2FF00', radius: 0.96, mass: 9.0122 },
  B: { color: '#FFB5B5', radius: 0.84, mass: 10.81 },
  C: { color: '#909090', radius: 0.76, mass: 12.011 },
  N: { color: '#3050F8', radius: 0.71, mass: 14.007 },
  O: { color: '#FF0D0D', radius: 0.66, mass: 15.999 },
  F: { color: '#90E050', radius: 0.57, mass: 18.998 },
  Ne: { color: '#B3E3F5', radius: 0.58, mass: 20.180 },
  Na: { color: '#AB5CF2', radius: 1.66, mass: 22.990 },
  Mg: { color: '#8AFF00', radius: 1.41, mass: 24.305 },
  Al: { color: '#BFA6A6', radius: 1.21, mass: 26.982 },
  Si: { color: '#F0C8A0', radius: 1.11, mass: 28.085 },
  P: { color: '#FF8000', radius: 1.07, mass: 30.974 },
  S: { color: '#FFFF30', radius: 1.05, mass: 32.06 },
  Cl: { color: '#1FF01F', radius: 1.02, mass: 35.45 },
  Ar: { color: '#80D1E3', radius: 1.06, mass: 39.948 },
  K: { color: '#8F40D4', radius: 2.03, mass: 39.098 },
  Ca: { color: '#3DFF00', radius: 1.76, mass: 40.078 },
};

// Bond lengths between elements (in Angstroms)
const BOND_LENGTHS = {
  'C-C': 1.54,
  'C-H': 1.09,
  'C-O': 1.43,
  'C-N': 1.47,
  'C-S': 1.82,
  'C-Cl': 1.77,
  'H-H': 0.74,
  'H-O': 0.96,
  'H-N': 1.01,
  'O-O': 1.48,
  'O-H': 0.96,
  'N-H': 1.01,
  'N-N': 1.45,
};

// Get a bond length between two elements
const getBondLength = (element1, element2) => {
  const bond = `${element1}-${element2}`;
  const reverseBond = `${element2}-${element1}`;
  
  if (BOND_LENGTHS[bond]) return BOND_LENGTHS[bond];
  if (BOND_LENGTHS[reverseBond]) return BOND_LENGTHS[reverseBond];
  
  return (ELEMENT_PROPERTIES[element1]?.radius || 1.0) + (ELEMENT_PROPERTIES[element2]?.radius || 1.0);
};

// Generate 3D coordinates for a molecule based on its formula
const generateSimpleMoleculeStructure = (formula) => {
  const elements = parseFormula(formula);
  const atomTypes = Object.keys(elements);
  
  let atoms = [];
  let bonds = [];
  let position = { x: 0, y: 0, z: 0 };
  
  if (atomTypes.length === 0) return { atoms, bonds };
  
  // Special handling for common molecules
  if (formula === 'H2') {
    atoms.push({
      element: 'H',
      position: { x: 0, y: 0, z: 0 },
      color: ELEMENT_PROPERTIES['H'].color,
      radius: ELEMENT_PROPERTIES['H'].radius
    });
    atoms.push({
      element: 'H',
      position: { x: 0, y: 0, z: 0.74 },
      color: ELEMENT_PROPERTIES['H'].color,
      radius: ELEMENT_PROPERTIES['H'].radius
    });
    bonds.push({
      from: 0,
      to: 1,
      bondType: 'single',
      distance: 0.74
    });
    return { atoms, bonds };
  }
  
  if (formula === 'O2') {
    atoms.push({
      element: 'O',
      position: { x: 0, y: 0, z: 0 },
      color: ELEMENT_PROPERTIES['O'].color,
      radius: ELEMENT_PROPERTIES['O'].radius
    });
    atoms.push({
      element: 'O',
      position: { x: 0, y: 0, z: 1.48 },
      color: ELEMENT_PROPERTIES['O'].color,
      radius: ELEMENT_PROPERTIES['O'].radius
    });
    bonds.push({
      from: 0,
      to: 1,
      bondType: 'double',
      distance: 1.48
    });
    return { atoms, bonds };
  }
  
  if (formula === 'H2O') {
    // Place oxygen at origin
    atoms.push({
      element: 'O',
      position: { x: 0, y: 0, z: 0 },
      color: ELEMENT_PROPERTIES['O'].color,
      radius: ELEMENT_PROPERTIES['O'].radius
    });
    // Place hydrogens with 104.5-degree bond angle
    const bondLength = 0.96;
    const angle = 104.5 * Math.PI / 180;
    atoms.push({
      element: 'H',
      position: { x: bondLength * Math.cos(angle / 2), y: 0, z: bondLength * Math.sin(angle / 2) },
      color: ELEMENT_PROPERTIES['H'].color,
      radius: ELEMENT_PROPERTIES['H'].radius
    });
    atoms.push({
      element: 'H',
      position: { x: -bondLength * Math.cos(angle / 2), y: 0, z: bondLength * Math.sin(angle / 2) },
      color: ELEMENT_PROPERTIES['H'].color,
      radius: ELEMENT_PROPERTIES['H'].radius
    });
    bonds.push({
      from: 0,
      to: 1,
      bondType: 'single',
      distance: bondLength
    });
    bonds.push({
      from: 0,
      to: 2,
      bondType: 'single',
      distance: bondLength
    });
    return { atoms, bonds };
  }
  
  // General case
  const centralElement = atomTypes.find(el => el !== 'H') || atomTypes[0];
  atoms.push({
    element: centralElement,
    position: { ...position },
    color: ELEMENT_PROPERTIES[centralElement]?.color || '#909090',
    radius: ELEMENT_PROPERTIES[centralElement]?.radius || 0.8
  });
  
  elements[centralElement] = elements[centralElement] - 1;
  
  let angle = 0;
  let level = 0;
  
  for (const element in elements) {
    for (let i = 0; i < elements[element]; i++) {
      const radius = getBondLength(centralElement, element);
      const phi = angle * Math.PI / 4;
      const theta = level * Math.PI / 6 + (Math.PI / 12); // Slight offset to avoid overlap
      
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      
      atoms.push({
        element,
        position: { x, y, z },
        color: ELEMENT_PROPERTIES[element]?.color || '#909090',
        radius: ELEMENT_PROPERTIES[element]?.radius || 0.8
      });
      
      bonds.push({
        from: 0,
        to: atoms.length - 1,
        bondType: 'single',
        distance: radius
      });
      
      angle = (angle + 1) % 8;
      if (angle === 0) level++;
    }
  }
  
  return { atoms, bonds };
};

// Try to fetch molecule data from PubChem API
const fetchMoleculeFromPubChem = async (formula) => {
  try {
    const response = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/formula/${formula}/JSON`);
    
    if (response.data && response.data.PC_Compounds && response.data.PC_Compounds.length > 0) {
      const cid = response.data.PC_Compounds[0].id.id.cid;
      
      const coords = await axios.get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/JSON/?record_type=3d`);
      
      if (coords.data && coords.data.PC_Compounds && coords.data.PC_Compounds.length > 0) {
        const compound = coords.data.PC_Compounds[0];
        const atoms = [];
        const bonds = [];
        
        if (compound.atoms && compound.atoms.element) {
          for (let i = 0; i < compound.atoms.element.length; i++) {
            const elementSymbol = getElementSymbol(compound.atoms.element[i]);
            atoms.push({
              element: elementSymbol,
              position: {
                x: compound.coords[0].conformers[0].x[i],
                y: compound.coords[0].conformers[0].y[i],
                z: compound.coords[0].conformers[0].z[i]
              },
              color: ELEMENT_PROPERTIES[elementSymbol]?.color || '#909090',
              radius: ELEMENT_PROPERTIES[elementSymbol]?.radius || 0.8
            });
          }
        }
        
        if (compound.bonds) {
          for (let i = 0; i < compound.bonds.aid1.length; i++) {
            bonds.push({
              from: compound.bonds.aid1[i] - 1,
              to: compound.bonds.aid2[i] - 1,
              bondType: getBondType(compound.bonds.order[i]),
              distance: calculateDistance(
                atoms[compound.bonds.aid1[i] - 1].position,
                atoms[compound.bonds.aid2[i] - 1].position
              )
            });
          }
        }
        
        return { atoms, bonds };
      }
    }
    
    return generateSimpleMoleculeStructure(formula);
  } catch (error) {
    console.log(`Could not fetch from PubChem: ${error.message}`);
    return generateSimpleMoleculeStructure(formula);
  }
};

// Get element symbol from atomic number
const getElementSymbol = (atomicNumber) => {
  const elementMap = {
    1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
    11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca'
  };
  return elementMap[atomicNumber] || 'Unknown';
};

// Get bond type from bond order
const getBondType = (order) => {
  switch (order) {
    case 1: return 'single';
    case 2: return 'double';
    case 3: return 'triple';
    default: return 'single';
  }
};

// Calculate distance between two points
const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) +
    Math.pow(point2.y - point1.y, 2) +
    Math.pow(point2.z - point1.z, 2)
  );
};

// Main function to generate molecule data
const generateMoleculeData = async (formula) => {
  try {
    return await fetchMoleculeFromPubChem(formula);
  } catch (error) {
    console.error(`Error generating molecule data: ${error.message}`);
    return generateSimpleMoleculeStructure(formula);
  }
};

module.exports = { generateMoleculeData };