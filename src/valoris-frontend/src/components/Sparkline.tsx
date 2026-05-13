interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ values, width = 80, height = 24, color = 'var(--color-primary)' }: Props) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const delta = last - prev;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 'var(--text-xs)', color: delta >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
        {delta >= 0 ? '▲' : '▼'}
      </span>
    </span>
  );
}
