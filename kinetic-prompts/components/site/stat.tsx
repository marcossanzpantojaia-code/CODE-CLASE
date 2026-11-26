/** Cifra destacada: número grande en mono y su explicación. */
export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1 border-l border-border pl-4">
      <span className="font-mono text-28 leading-display text-text">{value}</span>
      <span className="text-12 text-text-muted">{label}</span>
    </div>
  );
}
