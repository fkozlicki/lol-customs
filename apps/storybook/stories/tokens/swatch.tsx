/** A swatch names the token, so a reader can copy the class rather than guess the hue. */
export function Swatch({
  token,
  className,
}: {
  token: string;
  className: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 w-full border ${className}`} />
      <p className="num text-xs">{token}</p>
    </div>
  );
}
