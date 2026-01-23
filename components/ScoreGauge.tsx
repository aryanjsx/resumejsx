
import React from 'react';

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 76) return '#16a34a'; // green-600
    if (score >= 51) return '#f59e0b'; // amber-500
    return '#dc2626'; // red-600
  };

  const color = getScoreColor();

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="15"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          strokeWidth="15"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: color }}>
          {score}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">out of 100</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
