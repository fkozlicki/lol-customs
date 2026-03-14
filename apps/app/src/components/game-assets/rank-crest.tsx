import Image from "next/image";
import { rankCrestUrl } from "@/utils/asset-urls";

interface RankCrestProps {
  tier: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export function RankCrest({
  tier,
  width = 16,
  height = 16,
  className,
}: RankCrestProps) {
  return (
    <Image
      src={rankCrestUrl(tier)}
      alt=""
      width={width}
      height={height}
      unoptimized
      className={className}
    />
  );
}
