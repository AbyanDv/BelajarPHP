import React, { useState, useMemo } from 'react';
import './styles.css';

// --- Membership Functions (Fuzzification) ---
const screentimeMembership = {
  rendah: (x) => {
    if (x <= 2) return 1;
    if (x >= 4) return 0;
    return (4 - x) / 2;
  },
  sedang: (x) => {
    if (x <= 3) return 0;
    if (x <= 5.5) return (x - 3) / 2.5;
    if (x <= 8) return (8 - x) / 2.5;
    return 0;
  },
  tinggi: (x) => {
    if (x <= 7) return 0;
    if (x >= 10) return 1;
    return (x - 7) / 3;
  }
};

const temperatureMembership = {
  dingin: (x) => {
    if (x <= 18) return 1;
    if (x >= 22) return 0;
    return (22 - x) / 4;
  },
  nyaman: (x) => {
    if (x <= 20 || x >= 28) return 0;
    if (x <= 24) return (x - 20) / 4;
    if (x <= 28) return (28 - x) / 4;
    return 0;
  },
  panas: (x) => {
    if (x <= 26) return 0;
    if (x >= 30) return 1;
    return (x - 26) / 4;
  }
};

const stressMembership = {
  rendah: (x) => {
    if (x <= 20) return 1;
    if (x >= 40) return 0;
    return (40 - x) / 20;
  },
  sedang: (x) => {
    if (x <= 30 || x >= 70) return 0;
    if (x <= 50) return (x - 30) / 20;
    return (70 - x) / 20;
  },
  tinggi: (x) => {
    if (x <= 60) return 0;
    if (x >= 80) return 1;
    return (x - 60) / 20;
  }
};

// --- Fuzzy Rules (Inferensi) ---
const evaluateRules = (stMembership, tempMembership) => {
  const ruleDefinitions = [
    { name: 'R1', st: 'rendah', temp: 'dingin', output: 'rendah' },
    { name: 'R2', st: 'rendah', temp: 'nyaman', output: 'rendah' },
    { name: 'R3', st: 'rendah', temp: 'panas', output: 'sedang' },
    { name: 'R4', st: 'sedang', temp: 'dingin', output: 'sedang' },
    { name: 'R5', st: 'sedang', temp: 'nyaman', output: 'sedang' },
    { name: 'R6', st: 'sedang', temp: 'panas', output: 'tinggi' },
    { name: 'R7', st: 'tinggi', temp: 'dingin', output: 'tinggi' },
    { name: 'R8', st: 'tinggi', temp: 'nyaman', output: 'tinggi' },
    { name: 'R9', st: 'tinggi', temp: 'panas', output: 'tinggi' }
  ];

  const rules = ruleDefinitions.map(def => ({
    ...def,
    condition: Math.min(stMembership[def.st], tempMembership[def.temp]),
  }));
  
  return rules.filter(rule => rule.condition > 0);
};

// --- Defuzzification (Centroid of Area) ---
const defuzzify = (activeRules) => {
  const points = 100; 
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i <= points; i++) {
    const z = i;
    let membership = 0;
    
    activeRules.forEach(rule => {
      const ruleMembership = Math.min(
        rule.condition, 
        stressMembership[rule.output](z)
      );
      membership = Math.max(membership, ruleMembership);
    });
    
    numerator += z * membership;
    denominator += membership;
  }
  
  return denominator === 0 ? 50 : numerator / denominator;
};

// --- Slider Component ---
const Slider = ({ value, onChange, min, max, step, label }) => (
  <div className="slider-container">
    <div className="slider-header">
      <label className="slider-label">{label}</label>
      <span className="slider-value">
        {value} {label.includes('Suhu') ? '°C' : 'jam'}
      </span>
    </div>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="slider-input"
    />
    <div className="slider-ticks">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

// --- Membership Chart ---
const FuzzyMembershipChart = ({ title, currentValue, membershipFuncs, range, unit, values }) => {
  const width = 700;
  const height = 400;
  const padding = { left: 70, right: 100, top: 50, bottom: 70 };
  
  const xScale = (x) => padding.left + ((x - range[0]) / (range[1] - range[0])) * (width - padding.left - padding.right);
  const yScale = (y) => height - padding.bottom - (y * (height - padding.top - padding.bottom));
  
  const generateCurvePoints = (func) => {
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = range[0] + (range[1] - range[0]) * (i / steps);
      const y = func(x);
      points.push({ x, y });
    }
    return points;
  };
  
  const createPath = (points) => {
    return points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`
    ).join(' ');
  };
  
  const colors = {
    rendah: '#3b82f6',
    sedang: '#10b981',
    tinggi: '#ef4444',
    dingin: '#3b82f6',
    nyaman: '#10b981',
    panas: '#ef4444'
  };
  
  const labels = {
    rendah: 'Rendah',
    sedang: 'Sedang',
    tinggi: 'Tinggi',
    dingin: 'Dingin',
    nyaman: 'Nyaman',
    panas: 'Panas'
  };
  
  const curves = Object.entries(membershipFuncs).map(([key, func]) => ({
    key,
    points: generateCurvePoints(func),
    color: colors[key],
    label: labels[key],
    value: values ? values[key] : func(currentValue)
  }));
  
  const xTicks = range[0] === 0 ? [0, 2, 4, 6, 8, 10, 12, 14, 16] : [16, 18, 20, 22, 24, 26, 28, 30, 32, 35];
  if (range[0] === 0 && range[1] === 100) {
    xTicks.splice(0, xTicks.length, 0, 20, 40, 50, 60, 80, 100);
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        {/* Grid lines */}
        {xTicks.map(x => (
          <line key={`vline-${x}`} x1={xScale(x)} y1={padding.top} x2={xScale(x)} y2={height - padding.bottom} 
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2"/>
        ))}
        {yTicks.map(y => (
          <line key={`hline-${y}`} x1={padding.left} y1={yScale(y)} x2={width - padding.right} y2={yScale(y)} 
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2"/>
        ))}
        
        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} 
              stroke="#374151" strokeWidth="2"/>
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} 
              stroke="#374151" strokeWidth="2"/>
        
        {/* X-axis labels */}
        {xTicks.map(x => (
          <text key={`xlabel-${x}`} x={xScale(x)} y={height - padding.bottom + 25} textAnchor="middle" 
              fontSize="12" fill="#6b7280" fontWeight="500">{x}</text>
        ))}
        <text x={width / 2} y={height - 20} textAnchor="middle" fontSize="14" fill="#374151" fontWeight="600">
          {unit}
        </text>
        
        {/* Y-axis labels */}
        {yTicks.map(y => (
          <text key={`ylabel-${y}`} x={padding.left - 15} y={yScale(y) + 5} textAnchor="end" 
              fontSize="12" fill="#6b7280" fontWeight="500">{y.toFixed(2)}</text>
        ))}
        
        {/* Membership curves */}
        {curves.map((curve) => (
          <path key={curve.key} d={createPath(curve.points)} fill="none" stroke={curve.color} strokeWidth="3"/>
        ))}
        
        {/* Current value indicator */}
        {currentValue !== undefined && range[1] <= 35 && (
          <>
            <line x1={xScale(currentValue)} y1={padding.top} x2={xScale(currentValue)} y2={height - padding.bottom} 
                stroke="#7c3aed" strokeWidth="3" strokeDasharray="5,5"/>
            
            {/* Intersection points */}
            {curves.map((curve) => 
              curve.value > 0 && (
                <circle key={`point-${curve.key}`} cx={xScale(currentValue)} cy={yScale(curve.value)} 
                        r="7" fill={curve.color} stroke="white" strokeWidth="2.5"/>
              )
            )}
          </>
        )}
      </svg>
      
      {/* Membership values display */}
      {values && (
        <div className="membership-grid">
          {curves.map((curve) => (
            <div 
              key={`value-${curve.key}`} 
              className={`membership-card ${curve.value > 0 ? '' : 'inactive'}`}
              style={{
                background: curve.value > 0 ? `${curve.color}15` : '#f9fafb',
                border: `2px solid ${curve.value > 0 ? curve.color : '#e5e7eb'}`
              }}
            >
              <div className="membership-label">{curve.label}</div>
              <div className="membership-percentage" style={{ color: curve.color }}>
                {(curve.value * 100).toFixed(1)}%
              </div>
              <div className="membership-mu">μ = {curve.value.toFixed(3)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Interactive Rules Display ---
const InteractiveRules = ({ activeRules, stMembership, tempMembership }) => {
  const [selectedRule, setSelectedRule] = useState(null);

  const stColors = { rendah: '#3b82f6', sedang: '#10b981', tinggi: '#ef4444' };
  const tempColors = { dingin: '#3b82f6', nyaman: '#10b981', panas: '#ef4444' };
  const stressColors = { rendah: '#10b981', sedang: '#f59e0b', tinggi: '#ef4444' };

  const getRuleDescription = (rule) => {
    const stValue = stMembership[rule.st].toFixed(3);
    const tempValue = tempMembership[rule.temp].toFixed(3);
    return `IF Screentime is ${rule.st} (μ=${stValue}) AND Suhu is ${rule.temp} (μ=${tempValue}) THEN Stress is ${rule.output}`;
  };

  return (
    <div className="rules-container">
      <div className="rules-header">
        <h3 className="rules-title">🎯 Aturan Fuzzy yang Aktif</h3>
        <div className="rules-badge">{activeRules.length} aturan aktif</div>
      </div>

      {activeRules.length === 0 ? (
        <div className="rules-empty">
          Tidak ada aturan fuzzy yang aktif. Coba ubah nilai input!
        </div>
      ) : (
        <div className="rules-grid">
          {activeRules.map((rule, index) => (
            <div
              key={index}
              onClick={() => setSelectedRule(selectedRule === index ? null : index)}
              className={`rule-card ${selectedRule === index ? 'selected' : ''}`}
              style={{ border: `3px solid ${stressColors[rule.output]}` }}
            >
              {/* Rule Header */}
              <div className="rule-header">
                <div 
                  className="rule-name-badge" 
                  style={{ background: stressColors[rule.output] }}
                >
                  {rule.name}
                </div>
                <div className="rule-alpha-badge">α = {rule.condition.toFixed(3)}</div>
              </div>

              {/* Rule Content */}
              <div className="rule-content">
                <div className="rule-input-row">
                  <span 
                    className="rule-input-badge" 
                    style={{ 
                      background: stColors[rule.st] + '20',
                      color: stColors[rule.st]
                    }}
                  >
                    Screentime: {rule.st}
                  </span>
                  <span className="rule-mu-value">μ = {stMembership[rule.st].toFixed(3)}</span>
                </div>

                <div className="rule-input-row">
                  <span 
                    className="rule-input-badge" 
                    style={{ 
                      background: tempColors[rule.temp] + '20',
                      color: tempColors[rule.temp]
                    }}
                  >
                    Suhu: {rule.temp}
                  </span>
                  <span className="rule-mu-value">μ = {tempMembership[rule.temp].toFixed(3)}</span>
                </div>

                <div className="rule-output-row">
                  <span className="rule-output-label">OUTPUT:</span>
                  <span 
                    className="rule-output-badge" 
                    style={{ 
                      background: stressColors[rule.output] + '20',
                      color: stressColors[rule.output]
                    }}
                  >
                    STRESS: {rule.output.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Hover effect background */}
              <div 
                className="rule-hover-effect"
                style={{ background: `linear-gradient(45deg, ${stressColors[rule.output]}10, transparent)` }}
              />
            </div>
          ))}
        </div>
      )}

      {selectedRule !== null && activeRules[selectedRule] && (
        <div 
          className="rule-detail"
          style={{ border: `2px solid ${stressColors[activeRules[selectedRule].output]}` }}
        >
          <div className="rule-detail-title">
            📖 Detail Aturan {activeRules[selectedRule].name}:
          </div>
          <div className="rule-detail-description">
            {getRuleDescription(activeRules[selectedRule])}
          </div>
          <div className="rule-detail-alpha">
            α-predikat (MIN): {activeRules[selectedRule].condition.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Stress Aggregation Chart with Integrated Rules ---
const StressChart = ({ stressLevel, activeRules, stMembership, tempMembership }) => {
  const width = 700;
  const height = 400;
  const padding = { left: 70, right: 100, top: 50, bottom: 70 };
  const range = [0, 100];
  
  const xScale = (x) => padding.left + ((x - range[0]) / (range[1] - range[0])) * (width - padding.left - padding.right);
  const yScale = (y) => height - padding.bottom - (y * (height - padding.top - padding.bottom));
  
  // Calculate the Aggregated Curve Points (MAX operator for Mamdani aggregation)
  const aggregatedPoints = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const z = range[0] + (range[1] - range[0]) * (i / steps);
    let maxMembership = 0;
    
    activeRules.forEach(rule => {
      const clippedMembership = Math.min(
        rule.condition,
        stressMembership[rule.output](z)
      );
      maxMembership = Math.max(maxMembership, clippedMembership);
    });
    aggregatedPoints.push({ x: z, y: maxMembership });
  }

  const createPath = (points) => {
    return points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`
    ).join(' ');
  };

  const xTicks = [0, 20, 40, 50, 60, 80, 100];
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  
  return (
    <div className="stress-chart-container">
      {/* Interactive Rules Display - NOW AT THE TOP */}
      <InteractiveRules activeRules={activeRules} stMembership={stMembership} tempMembership={tempMembership} />
      
      <h3 className="stress-chart-title">
        📊 Kurva Agregasi Stress & Hasil Defuzzifikasi
      </h3>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        {/* Grid lines */}
        {xTicks.map(x => (
          <line key={`vline-${x}`} x1={xScale(x)} y1={padding.top} x2={xScale(x)} y2={height - padding.bottom} 
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2"/>
        ))}
        {yTicks.map(y => (
          <line key={`hline-${y}`} x1={padding.left} y1={yScale(y)} x2={width - padding.right} y2={yScale(y)} 
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2"/>
        ))}
        
        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} 
              stroke="#374151" strokeWidth="2"/>
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} 
              stroke="#374151" strokeWidth="2"/>
        
        {/* X-axis labels */}
        {xTicks.map(x => (
          <text key={`xlabel-${x}`} x={xScale(x)} y={height - padding.bottom + 25} textAnchor="middle" 
              fontSize="12" fill="#6b7280" fontWeight="500">{x}</text>
        ))}
        <text x={width / 2} y={height - 20} textAnchor="middle" fontSize="14" fill="#374151" fontWeight="600">
          Tingkat Stress (0-100%)
        </text>
        
        {/* Y-axis labels */}
        {yTicks.map(y => (
          <text key={`ylabel-${y}`} x={padding.left - 15} y={yScale(y) + 5} textAnchor="end" 
              fontSize="12" fill="#6b7280" fontWeight="500">{y.toFixed(2)}</text>
        ))}
        
        {/* Aggregated Curve */}
        <path d={createPath(aggregatedPoints)} fill="rgba(252, 211, 77, 0.4)" stroke="#b45309" strokeWidth="3"/>

        {/* Centroid (Defuzzified Result) Indicator */}
        <line x1={xScale(stressLevel)} y1={padding.top} x2={xScale(stressLevel)} y2={height - padding.bottom} 
              stroke="#ef4444" strokeWidth="3" strokeDasharray="5,2"/>

        <circle cx={xScale(stressLevel)} cy={height - padding.bottom} r="7" fill="#ef4444" stroke="white" strokeWidth="2.5"/>
        <text x={xScale(stressLevel)} y={padding.top - 15} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#ef4444">
          z* = {stressLevel.toFixed(1)}%
        </text>
      </svg>
      
      <div className="stress-chart-note">
        Titik z* adalah hasil akhir (crisp) dari proses Defuzzifikasi Centroid dengan Metode Mamdani.
      </div>
    </div>
  );
};

// --- Main Component ---
const FuzzyStressCalculator = () => {
  const [screentime, setScreentime] = useState(5.5); 
  const [temperature, setTemperature] = useState(25);
  
  // Fuzzification Calculation
  const stMembership = useMemo(() => ({
    rendah: screentimeMembership.rendah(screentime),
    sedang: screentimeMembership.sedang(screentime),
    tinggi: screentimeMembership.tinggi(screentime)
  }), [screentime]);
  
  const tempMembership = useMemo(() => ({
    dingin: temperatureMembership.dingin(temperature),
    nyaman: temperatureMembership.nyaman(temperature),
    panas: temperatureMembership.panas(temperature)
  }), [temperature]);
  
  // Inference Calculation
  const activeRules = useMemo(() => 
    evaluateRules(stMembership, tempMembership), 
    [stMembership, tempMembership]
  );
  
  // Defuzzification Calculation
  const stressLevel = useMemo(() => 
    defuzzify(activeRules), 
    [activeRules]
  );
  
  const getStressCategory = (stress) => {
    if (stress < 35) return { level: 'Rendah', color: 'green', bg: '#dcfce7', border: '#86efac', text: '#166534', range: '0% - 34.9%' };
    if (stress < 65) return { level: 'Sedang', color: 'yellow', bg: '#fef9c3', border: '#fde047', text: '#854d0e', range: '35% - 64.9%' };
    return { level: 'Tinggi', color: 'red', bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', range: '65% - 100%' };
  };
  
  const stressInfo = getStressCategory(stressLevel);
  
  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="header">
          <h1 className="header-title">
            🧠 Sistem Logika Fuzzy: Monitor Tingkat Stress
          </h1>
          <p className="header-subtitle">Metode Mamdani dengan Defuzzifikasi Centroid</p>
        </div>
        
        <div className="main-grid">
          {/* Input Section */}
          <div className="section-card">
            <h2 className="section-title">📊 Input Variabel & Fuzzifikasi</h2>
            
            <Slider
              value={screentime}
              onChange={setScreentime}
              min={0}
              max={16}
              step={0.1}
              label="⏱️ Screentime"
            />
            
            <FuzzyMembershipChart
              title="Fungsi Derajat Keanggotaan Fuzzy: Screentime"
              currentValue={screentime}
              membershipFuncs={screentimeMembership}
              range={[0, 16]}
              unit="Screentime (jam)"
              values={stMembership}
            />
            
            <Slider
              value={temperature}
              onChange={setTemperature}
              min={16}
              max={35}
              step={0.1}
              label="🌡️ Suhu Ruangan"
            />
            
            <FuzzyMembershipChart
              title="Fungsi Derajat Keanggotaan Fuzzy: Suhu Ruangan"
              currentValue={temperature}
              membershipFuncs={temperatureMembership}
              range={[16, 35]}
              unit="Suhu Ruangan (°C)"
              values={tempMembership}
            />
          </div>
          
          {/* Output Section */}
          <div className="section-card">
            <h2 className="section-title">📈 Hasil Akhir Defuzzifikasi</h2>
            
            {/* Final Result Display */}
            <div 
              className="result-display"
              style={{ 
                background: stressInfo.bg, 
                border: `3px solid ${stressInfo.border}` 
              }}
            >
              <div className="result-value" style={{ color: stressInfo.text }}>
                {stressLevel.toFixed(1)}%
              </div>
              <div className="result-category" style={{ color: stressInfo.text }}>
                Stress {stressInfo.level}
              </div>
              <div className="result-range" style={{ color: stressInfo.text }}>
                {stressInfo.range}
              </div>
            </div>
            
            {/* Interpretation */}
            <div className="interpretation-box">
              <p className="interpretation-text">
                <strong style={{ color: '#6d28d9' }}>💡</strong> Berdasarkan data input, perhitungan Centroid menghasilkan tingkat stress akhir sebesar <strong>{stressLevel.toFixed(1)}%</strong>, yang diklasifikasikan sebagai <strong>Stress {stressInfo.level}</strong>.
              </p>
              
              <div className="interpretation-divider">
                <p className="interpretation-subtitle">Tingkatan Stress:</p>
                <ul className="interpretation-list">
                  <li>
                    <span className="color-green" style={{ fontWeight: 'bold' }}>Rendah:</span> {getStressCategory(34).range}
                  </li>
                  <li>
                    <span className="color-yellow" style={{ fontWeight: 'bold' }}>Sedang:</span> {getStressCategory(64).range}
                  </li>
                  <li>
                    <span className="color-red" style={{ fontWeight: 'bold' }}>Tinggi:</span> {getStressCategory(65).range}
                  </li>
                </ul>
              </div>
            </div>

            {/* Stress Aggregation Chart with Integrated Rules */}
            <StressChart 
              stressLevel={stressLevel} 
              activeRules={activeRules} 
              stMembership={stMembership} 
              tempMembership={tempMembership} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuzzyStressCalculator;