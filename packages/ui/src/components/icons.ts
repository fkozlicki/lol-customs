import {
  Bold,
  Camera,
  ChevronDown,
  ChevronLeft,
  Copy,
  Crown,
  Download,
  Ellipsis,
  EyeOff,
  Folder,
  Gavel,
  Heading2,
  HelpCircle,
  Image,
  Italic,
  List,
  ListOrdered,
  Loader2,
  LogOut,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  PenSquare,
  Shuffle,
  Square,
  Sun,
  Swords,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  User,
  X,
} from "lucide-react";

/**
 * Every icon Derby uses, in one map for the app, the recipes and Derby Sync.
 *
 * Most are named after what they depict. An icon that stands for a CONTEXT.md term is named after the
 * term instead, so the mapping from a term to a picture has a single home. The map lists only icons
 * something uses; add one when you need it.
 */
export const Icons = {
  Bold,
  Camera,
  ChevronDown,
  ChevronLeft,
  Copy,
  Download,
  EyeOff,
  Folder,
  Heading2,
  HelpCircle,
  Image,
  Italic,
  List,
  ListOrdered,
  Loader: Loader2,
  LogOut,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  PenSquare,
  Shuffle,
  Square,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  User,
  X,
  /** Season standings. */
  Leaderboard: Trophy,
  /** A Match. */
  Matches: Swords,
  /** Hall of Fame. */
  HallOfFame: Crown,
  Auction: Gavel,
  /** The captain of a Team in an auction. */
  Captain: Crown,
  /** Overflow in the mobile navigation. */
  More: Ellipsis,
};

export type { LucideIcon } from "lucide-react";
