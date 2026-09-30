/** One total, blue's share against red's, as numbers either side of a bar. */
export function ComparisonBar({
  label,
  blue,
  red,
}: {
  label: string;
  blue: number;
  red: number;
}) {
  const total = blue + red;
  const bluePercent = total > 0 ? (blue / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="num flex justify-between text-[11px]">
        <span>{blue.toLocaleString()}</span>
        <span className="label-caps">{label}</span>
        <span>{red.toLocaleString()}</span>
      </div>
      <div className="flex h-1.5 bg-foreground/15">
        <div
          className="h-full bg-foreground/80"
          style={{ width: `${bluePercent}%` }}
        />
      </div>
    </div>
  );
}
