'use client';

import React from 'react';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  valueDisplay?: string | ((val: number) => string);
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  valueDisplay,
  minLabel,
  maxLabel,
  className = '',
}: SliderProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const display = typeof valueDisplay === 'function' ? valueDisplay(value) : valueDisplay ?? value;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {(label || valueDisplay !== undefined) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-semibold text-[#1d1d1f]">{label}</span>}
          {display && (
            <span className="font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2.5 py-0.5 rounded-full text-[11px]">
              {display}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center w-full py-1.5">
        <div className="absolute left-0 right-0 h-1.5 bg-[#e5e5ea] rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-[#0071e3] transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="apple-range-slider relative z-10 w-full h-1.5 bg-transparent appearance-none cursor-pointer focus:outline-none"
        />
      </div>

      {(minLabel || maxLabel) && (
        <div className="flex items-center justify-between text-[11px] text-[#86868b] font-medium px-0.5">
          <span>{minLabel ?? min}</span>
          <span>{maxLabel ?? max}</span>
        </div>
      )}
    </div>
  );
}
