/**
 * EcgViewer - Renders ECG waveform data as an SVG line chart with monitor aesthetic.
 */

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function EcgViewer({ waveformData = [] }) {
  const { t } = useLanguage();

  if (!waveformData || waveformData.length === 0) {
    return (
      <div className="ecg-viewer" data-testid="ecg-viewer">
        <h4 className="ecg-viewer__title">{t('ecgWaveform')}</h4>
        <p style={{ color: '#4ade80', fontSize: 'var(--font-size-sm)', opacity: 0.6 }}>
          No ECG data available
        </p>
      </div>
    );
  }

  const width = 360;
  const height = 140;
  const padding = 12;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Normalize data to fit chart
  const minVal = Math.min(...waveformData);
  const maxVal = Math.max(...waveformData);
  const range = maxVal - minVal || 1;

  const points = waveformData.map((val, i) => {
    const x = padding + (i / (waveformData.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  // Grid lines (medical monitor style)
  const gridLines = [];
  // Horizontal grid
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i / 5) * chartHeight;
    gridLines.push(
      <line
        key={`h-${i}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#1a3a1a"
        strokeWidth="1"
      />
    );
  }
  // Vertical grid
  for (let i = 0; i <= 10; i++) {
    const x = padding + (i / 10) * chartWidth;
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={padding}
        x2={x}
        y2={height - padding}
        stroke="#1a3a1a"
        strokeWidth="1"
      />
    );
  }

  return (
    <div className="ecg-viewer" data-testid="ecg-viewer">
      <h4 className="ecg-viewer__title">{t('ecgWaveform')}</h4>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="ecg-viewer__svg"
        role="img"
        aria-label={t('ecgWaveform')}
      >
        {/* Dark background */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#0a1a0a"
          rx="6"
        />
        {/* Grid */}
        {gridLines}
        {/* Glow effect */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* ECG trace with glow */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
}
