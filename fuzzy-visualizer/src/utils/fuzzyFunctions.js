// src/utils/fuzzyFunctions.js

// Fungsi keanggotaan Trapesium
export const trapezoidMembership = (x, a, b, c, d) => {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
};

// Fungsi keanggotaan Segitiga
export const triangleMembership = (x, a, b, c) => {
  if (x <= a || x >= c) return 0;
  if (x > a && x <= b) return (x - a) / (b - a);
  if (x > b && x < c) return (c - x) / (c - b);
  return 0;
};

// Fungsi keanggotaan Screentime
export const screentimeMembership = {
  low: (x) => trapezoidMembership(x, 0, 0, 2, 4),
  medium: (x) => triangleMembership(x, 3, 5.5, 8),
  high: (x) => trapezoidMembership(x, 7, 10, 16, 16)
};

// Fungsi keanggotaan Suhu
export const temperatureMembership = {
  cold: (x) => trapezoidMembership(x, 16, 16, 18, 22),
  comfortable: (x) => triangleMembership(x, 20, 23, 26),
  hot: (x) => trapezoidMembership(x, 24, 28, 35, 35)
};

// Fungsi keanggotaan Stress (Output)
export const stressMembership = {
  low: (x) => trapezoidMembership(x, 0, 0, 15, 30),
  medium: (x) => triangleMembership(x, 25, 45, 65),
  high: (x) => trapezoidMembership(x, 60, 80, 100, 100)
};

// Fuzzy Rules
export const evaluateRules = (stMembership, tempMembership) => {
  const rules = [
    { 
      condition: Math.min(stMembership.low, tempMembership.comfortable), 
      output: 'low', 
      name: 'ST Rendah & Suhu Nyaman' 
    },
    { 
      condition: Math.min(stMembership.low, tempMembership.cold), 
      output: 'low', 
      name: 'ST Rendah & Suhu Dingin' 
    },
    { 
      condition: Math.min(stMembership.low, tempMembership.hot), 
      output: 'medium', 
      name: 'ST Rendah & Suhu Panas' 
    },
    { 
      condition: Math.min(stMembership.medium, tempMembership.comfortable), 
      output: 'medium', 
      name: 'ST Sedang & Suhu Nyaman' 
    },
    { 
      condition: Math.min(stMembership.medium, tempMembership.cold), 
      output: 'medium', 
      name: 'ST Sedang & Suhu Dingin' 
    },
    { 
      condition: Math.min(stMembership.medium, tempMembership.hot), 
      output: 'medium', 
      name: 'ST Sedang & Suhu Panas' 
    },
    { 
      condition: Math.min(stMembership.high, tempMembership.comfortable), 
      output: 'medium', 
      name: 'ST Tinggi & Suhu Nyaman' 
    },
    { 
      condition: Math.min(stMembership.high, tempMembership.cold), 
      output: 'high', 
      name: 'ST Tinggi & Suhu Dingin' 
    },
    { 
      condition: Math.min(stMembership.high, tempMembership.hot), 
      output: 'high', 
      name: 'ST Tinggi & Suhu Panas' 
    }
  ];
  
  return rules.filter(rule => rule.condition > 0);
};

// Defuzzifikasi menggunakan Centroid
export const defuzzify = (activeRules) => {
  let numerator = 0;
  let denominator = 0;
  
  // Sample 100 titik dari 0-100%
  for (let stress = 0; stress <= 100; stress += 1) {
    let maxMembership = 0;
    
    activeRules.forEach(rule => {
      let outputMembership = 0;
      
      if (rule.output === 'low') {
        outputMembership = Math.min(rule.condition, stressMembership.low(stress));
      } else if (rule.output === 'medium') {
        outputMembership = Math.min(rule.condition, stressMembership.medium(stress));
      } else if (rule.output === 'high') {
        outputMembership = Math.min(rule.condition, stressMembership.high(stress));
      }
      
      maxMembership = Math.max(maxMembership, outputMembership);
    });
    
    numerator += stress * maxMembership;
    denominator += maxMembership;
  }
  
  return denominator > 0 ? numerator / denominator : 0;
};