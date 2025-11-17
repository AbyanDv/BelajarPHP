// src/components/Slider.js
import React from 'react';
import './Slider.css';

const Slider = ({ value, onChange, min, max, step, label }) => {
  return (
    <div className="slider-container">
      {label && (
        <label className="slider-label">
          {label}: <span className="slider-value">{value.toFixed(1)}</span>
        </label>
      )}
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="slider-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default Slider;