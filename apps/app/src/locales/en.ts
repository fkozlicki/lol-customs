export default {
  locale: {
    en: "English",
    pl: "Polish",
  },
  dashboard: {
    retry: "Try again",
    auth: {
      profile: {
        nickname: {
          tooShort: "Nicknames are at least 2 characters.",
          tooLong: "Nicknames are at most 30 characters.",
          invalid: "Only letters, numbers, spaces, underscores and dashes.",
        },
        toast: {
          success: "Welcome! Your profile is set up.",
          avatarTooLarge: "Avatar must be smaller than 5MB",
          signInFailed: "Failed to sign in. Please try again.",
          getUserFailed: "Failed to get user. Please try again.",
          avatarUploadFailed: "Failed to upload avatar. You can set it later.",
        },
      },
    },
    sidebar: {
      leaderboard: "Leaderboard",
      matchHistory: "Matches",
      hallOfFame: "Hall of Fame",
      shuffle: "Shuffle",
      auctions: "Auctions",
      posts: "Forum",
    },
    season: {
      label: "Season {number}",
      allTime: "All seasons",
    },
    pages: {
      matchHistory: {
        title: "Matches",
        description: "Every custom game on the ladder, newest first.",
      },
      shuffle: {
        title: "Shuffle",
        description:
          "Pick ten players and draw the teams. Sides, roles and captains are random.",
        toastDuplicate: "That player is already on the roster.",
        toastInvalidRiot: "Use SummonerName#TAG (e.g. Hide on bush#KR1).",
      },
      auctions: {
        title: "Live auctions",
        description:
          "Build two five-player squads in a public, server-timed bidding room.",
        create: "Create auction",
        cancel: "Cancel auction",
        creator: {
          eyebrow: "Auction house",
          title: "Create a live auction",
          description:
            "Pick the eight players the two captains will buy. You captain Team A; the other captain joins from the room link.",
          duplicate: "That Riot ID is already in the pool.",
          invalidRiotId: "Use the Game Name#TAG format.",
          updated: "Lobby updated.",
        },
        room: {
          teamB: "Team B",
        },
        lobby: {
          linkCopied: "Room link copied.",
          linkCopyFailed: "Could not copy the room link.",
        },
      },
      posts: {
        title: "Forum",
        newPost: "New post",
        description:
          "Where the group talks about matches, auctions and the season.",
        reactionFailed: "Could not save your reaction.",
        like: "Like",
        dislike: "Dislike",
        newPostPage: {
          contentPlaceholder: "Write your post...",
          titleRequired: "Give your post a title.",
          toast: {
            created: "Post created!",
          },
        },
        imageUpload: {
          tooLarge: "Images must be smaller than 10 MB.",
          failed: "Could not upload the image.",
        },
        comments: {
          placeholder: "Write a comment...",
        },
      },
      hallOfFame: {
        title: "Hall of Fame",
        description: "Who holds the ladder's best and worst records.",
        sections: {
          headline: "Ranking",
          form: "Form",
          fighting: "Fighting",
          multikills: "Multikills",
          farm: "Farm & gold",
          map: "Map & utility",
        },
        stats: {
          mvpMatches: "matches as MVP",
          matchesWithoutMvp: "matches, no MVP",
          aceMatches: "matches as ACE",
          matchesWithoutAce: "matches, no ACE",
          opScore: "OP score / match",
          winRate: "win rate",
          winStreak: "wins in a row",
          loseStreak: "losses in a row",
          kills: "kills / match",
          assists: "assists / match",
          damage: "damage / match",
          deaths: "deaths / match",
          ccTime: "CC seconds / match",
          kda: "KDA",
          doublekills: "double kills",
          pentakills: "pentakills",
          quadrakills: "quadrakills",
          triplekills: "triple kills",
          cs: "CS / match",
          jungleCs: "jungle CS as jungler",
          gold: "gold / match",
          level: "level at the end",
          vision: "vision / match",
          healing: "healing / match",
          turrets: "turrets / match",
        },
        cards: {
          double_trouble: {
            title: "Double Trouble",
            description: "Most double kills",
          },
          fewest_deaths: {
            title: "Immortal",
            description: "Fewest deaths per match",
          },
          best_kda: {
            title: "Flawless",
            description: "Highest KDA",
          },
          no_cc: {
            title: "Gentle Touch",
            description: "Least crowd control per match",
          },
          worst_farm: {
            title: "Vegetarian",
            description: "Lowest CS per match",
          },
          jungle_tourist: {
            title: "Jungle Tourist",
            description: "Least jungle CS per match as jungler",
          },
          mvp: {
            title: "MVP",
            description: "Matches as MVP",
          },
          never_mvp: {
            title: "Never MVP",
            description: "Matches without an MVP",
          },
          ace: {
            title: "ACE",
            description: "Matches as ACE",
          },
          never_ace: {
            title: "Never ACE",
            description: "Matches without an ACE",
          },
          op_score: {
            title: "Carry",
            description: "Average OP score",
          },
          worst_op_score: {
            title: "Dead Weight",
            description: "Lowest average OP score",
          },
          best_win_rate: {
            title: "Winner",
            description: "Highest win rate",
          },
          worst_win_rate: {
            title: "Doormat",
            description: "Lowest win rate",
          },
          best_streak: {
            title: "On Fire",
            description: "Longest winning streak",
          },
          tilted: {
            title: "Tilted",
            description: "Longest losing streak",
          },
          most_kills: {
            title: "Butcher",
            description: "Kills per match",
          },
          pacifist: {
            title: "Pacifist",
            description: "Fewest kills per match",
          },
          most_assists: {
            title: "Playmaker",
            description: "Assists per match",
          },
          lone_wolf: {
            title: "Lone Wolf",
            description: "Fewest assists per match",
          },
          damage_dealer: {
            title: "Heavy Artillery",
            description: "Damage to champions per match",
          },
          peashooter: {
            title: "Peashooter",
            description: "Least damage to champions per match",
          },
          cannon_fodder: {
            title: "Cannon Fodder",
            description: "Deaths per match",
          },
          cc_king: {
            title: "CC King",
            description: "Crowd control time per match",
          },
          feeder: {
            title: "Feeder",
            description: "Lowest KDA",
          },
          penta_hunter: {
            title: "Penta Hunter",
            description: "Pentakills",
          },
          quadra_killer: {
            title: "Four of a Kind",
            description: "Most quadrakills",
          },
          triple_threat: {
            title: "Hat Trick",
            description: "Most triple kills",
          },
          best_farm: {
            title: "Farmer",
            description: "CS per match",
          },
          jungle_clearer: {
            title: "Lumberjack",
            description: "Jungle CS per match as jungler",
          },
          gold_hoarder: {
            title: "Midas",
            description: "Gold earned per match",
          },
          broke: {
            title: "Bankrupt",
            description: "Least gold earned per match",
          },
          level_lead: {
            title: "Maxed Out",
            description: "Champion level at the end",
          },
          behind: {
            title: "Rookie",
            description: "Lowest champion level at the end",
          },
          vision_master: {
            title: "Eagle Eye",
            description: "Vision score per match",
          },
          blind: {
            title: "Mole",
            description: "Lowest vision score per match",
          },
          life_saver: {
            title: "Life Saver",
            description: "Healing per match",
          },
          no_heals: {
            title: "Quack",
            description: "Least healing per match",
          },
          tower_crusher: {
            title: "Wrecking Ball",
            description: "Turrets per match",
          },
          tower_hugger: {
            title: "Preservationist",
            description: "Fewest turrets per match",
          },
        },
      },
    },
  },
} as const;
