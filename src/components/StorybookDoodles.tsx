import React from 'react';

/**
 * Cute Hand-Drawn Doodle Ornaments
 * Soft Korean/Japanese stationery & scrapbook illustrations
 * Handcrafted vector paths with dark warm brown outlines (#433422)
 */

export const CloudDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-16 h-10',
  color = '#b5def5',
}) => (
  <svg
    viewBox="0 0 70 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none pointer-events-none ${className}`}
  >
    {/* Soft cloud body */}
    <path
      d="M16 35C9 35 4 30 4 23C4 16 9 12 16 13C17 7 23 3 32 3C40 3 47 7 49 13C55 12 63 16 63 23C63 30 58 35 50 35H16Z"
      fill={color}
      stroke="#433422"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Cute smiling face */}
    <circle cx="27" cy="20" r="1.8" fill="#433422" />
    <circle cx="41" cy="20" r="1.8" fill="#433422" />
    {/* Gentle smile */}
    <path
      d="M31 23C32.5 25 35.5 25 37 23"
      stroke="#433422"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Cheerful blush */}
    <circle cx="23" cy="22" r="2.2" fill="#ffb7b2" opacity="0.8" />
    <circle cx="45" cy="22" r="2.2" fill="#ffb7b2" opacity="0.8" />
  </svg>
);

export const FlowerDoodle: React.FC<{ className?: string; color?: string; centerColor?: string }> = ({
  className = 'w-7 h-7',
  color = '#ff9aa2',
  centerColor = '#fed7aa',
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none pointer-events-none ${className}`}
  >
    {/* 5 Petals */}
    <circle cx="18" cy="8" r="6" fill={color} stroke="#433422" strokeWidth="2" />
    <circle cx="27.5" cy="15" r="6" fill={color} stroke="#433422" strokeWidth="2" />
    <circle cx="24" cy="26" r="6" fill={color} stroke="#433422" strokeWidth="2" />
    <circle cx="12" cy="26" r="6" fill={color} stroke="#433422" strokeWidth="2" />
    <circle cx="8.5" cy="15" r="6" fill={color} stroke="#433422" strokeWidth="2" />
    {/* Center */}
    <circle cx="18" cy="18" r="5" fill={centerColor} stroke="#433422" strokeWidth="2" />
  </svg>
);

export const StarDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#fde047',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none pointer-events-none ${className}`}
  >
    {/* Hand-drawn 4-point organic star */}
    <path
      d="M12 2C12.5 7 15 9.5 20 10C15 10.5 12.5 13 12 18C11.5 13 9 10.5 4 10C9 9.5 11.5 7 12 2Z"
      fill={color}
      stroke="#433422"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const LeafSproutDoodle: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-6 h-6',
  color = '#88aa8d',
}) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none pointer-events-none ${className}`}
  >
    {/* Stem */}
    <path
      d="M14 26C14 17 14 10 14 6"
      stroke="#433422"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Left leaf */}
    <path
      d="M14 15C9 14 4 9 7 5C10 5 13 10 14 15Z"
      fill={color}
      stroke="#433422"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Right leaf */}
    <path
      d="M14 11C19 10 24 5 21 2C18 2 15 7 14 11Z"
      fill={color}
      stroke="#433422"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const WashiTape: React.FC<{
  className?: string;
  variant?: 'mint' | 'peach' | 'sky' | 'yellow';
}> = ({ className = '', variant = 'mint' }) => {
  const variantClass =
    variant === 'peach'
      ? 'washi-tape-peach'
      : variant === 'sky'
      ? 'washi-tape-sky'
      : variant === 'yellow'
      ? 'washi-tape-yellow'
      : 'washi-tape-mint';

  return (
    <div
      className={`h-4 w-14 rounded-xs transform -rotate-3 select-none pointer-events-none ${variantClass} ${className}`}
      aria-hidden="true"
    />
  );
};
