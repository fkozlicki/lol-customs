import { rankCrestUrl } from "@/utils/asset-urls";
import Image from "next/image";

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
      className={className}
    />
  );
}
