interface Props {
  value: number | null | undefined;
  eenheid?: string;
  decimals?: number;
}

export function InlineNumber({ value, eenheid, decimals = 1 }: Props) {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  }
  const formatted = value.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatted}{eenheid ? <span style={{ color: 'var(--color-text-muted)', marginLeft: 2, fontSize: '0.85em' }}>{eenheid}</span> : null}
    </span>
  );
}
