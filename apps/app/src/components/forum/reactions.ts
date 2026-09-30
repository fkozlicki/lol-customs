export type ReactionType = "like" | "dislike";

export interface Reaction {
  type: string;
  user_id: string;
}

/** A post or a comment: its reactions and the counts derived from them. */
interface Reacted {
  reactions: Reaction[];
  likes: number;
  dislikes: number;
}

/** The reader's reaction, or null when they have none or are signed out. */
export function myReaction(
  reactions: Reaction[],
  userId: string | null,
): string | null {
  if (!userId) return null;
  return reactions.find((r) => r.user_id === userId)?.type ?? null;
}

/**
 * What a toggle does, for the optimistic update: the same reaction again takes it back, another one
 * replaces it. The counts follow the reactions.
 */
export function withReactionToggled<T extends Reacted>(
  target: T,
  userId: string,
  type: ReactionType,
): T {
  const others = target.reactions.filter((r) => r.user_id !== userId);
  const reactions =
    myReaction(target.reactions, userId) === type
      ? others
      : [...others, { type, user_id: userId }];
  return {
    ...target,
    reactions,
    likes: reactions.filter((r) => r.type === "like").length,
    dislikes: reactions.filter((r) => r.type === "dislike").length,
  };
}
