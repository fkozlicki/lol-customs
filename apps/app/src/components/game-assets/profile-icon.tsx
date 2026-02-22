import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { cn } from "@v1/ui/cn";
import { profileIconUrl } from "@/utils/asset-urls";

interface ProfileIconProps {
  iconId: number | null;
  name: string;
  avatarClassName?: string;
  fallbackClassName?: string;
  fallbackChars?: number;
}

export function ProfileIcon({
  iconId,
  name,
  avatarClassName,
  fallbackClassName,
  fallbackChars = 2,
}: ProfileIconProps) {
  const iconUrl = profileIconUrl(iconId);

  return (
    <Avatar className={cn("shrink-0", avatarClassName)}>
      {iconUrl ? (
        <AvatarImage src={iconUrl} alt="" className="object-cover" />
      ) : null}
      <AvatarFallback
        className={cn("bg-muted text-muted-foreground", fallbackClassName)}
      >
        {name.slice(0, fallbackChars).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
