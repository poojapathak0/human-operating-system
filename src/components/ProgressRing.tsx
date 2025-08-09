import { useEffect, useState } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

export default function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = '#667eea',
  bgColor = 'rgba(255,255,255,0.1)',
  children,
  animated = true 
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(progress);
      return;
    }
    
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
            filter: 'drop-shadow(0 0 8px rgba(102, 126, 234, 0.3))'
          }}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MoodProgressRing({ mood, total }: { mood: string; total: number }) {
  const moodEmojis: Record<string, string> = {
    sad: '😢',
    tired: '😴', 
    neutral: '😐',
    calm: '😌',
    happy: '😊'
  };

  const moodColors: Record<string, string> = {
    sad: '#ef4444',
    tired: '#f59e0b',
    neutral: '#6b7280',
    calm: '#10b981',
    happy: '#3b82f6'
  };

  const percentage = Math.min(total * 10, 100); // Scale for visual appeal

  return (
    <ProgressRing 
      progress={percentage} 
      color={moodColors[mood]} 
      size={100}
      strokeWidth={6}
    >
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{moodEmojis[mood]}</div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{total}</div>
    </ProgressRing>
  );
}
