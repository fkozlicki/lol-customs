import { ProfileIcon } from "../game-assets/profile-icon";

interface PlayerHeaderProps {
  name: string;
  tagLine: string;
  iconId: number | null;
  /** The line under the name, e.g. the player's rank; loads on its own. */
  children?: React.ReactNode;
}

/** The top of a profile: the player's icon, Riot ID and rank. */
export function PlayerHeader({
  name,
  tagLine,
  iconId,
  children,
}: PlayerHeaderProps) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <ProfileIcon
        iconId={iconId}
        name={name}
        fallbackChars={2}
        avatarClassName="size-16 rounded-none sm:size-24"
        fallbackClassName="rounded-none"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="truncate text-3xl font-semibold leading-none tracking-[-0.03em] sm:text-5xl">
          {name}
          <span className="font-normal text-muted-foreground"> #{tagLine}</span>
        </h1>
        {children}
      </div>
    </div>
  );
}
