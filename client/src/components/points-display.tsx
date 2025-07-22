interface PointsDisplayProps {
  points: number;
  className?: string;
}

export function getPointsColor(points: number): string {
  if (points < 10000) return '#8CC8FF';
  if (points < 25000) return '#FFD98C';
  if (points < 75000) return '#FF8CC8';
  return '#FF6B6B';
}

export function getPointsColorClass(points: number): string {
  if (points < 10000) return 'points-blue';
  if (points < 25000) return 'points-yellow';
  if (points < 75000) return 'points-pink';
  return 'points-red';
}

export default function PointsDisplay({ points, className = '' }: PointsDisplayProps) {
  const colorClass = getPointsColorClass(points);
  const color = getPointsColor(points);
  
  return (
    <span 
      className={`${colorClass} ${className}`}
      style={{ 
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 900,
        fontSize: '2.25rem',
        letterSpacing: '-0.03em',
        color: color,
        lineHeight: 1
      }}
    >
      {points.toLocaleString('pt-BR')}
    </span>
  );
}