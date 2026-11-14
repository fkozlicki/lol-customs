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
          nicknameTaken: "This nickname is already taken.",
          setupFailed: "Could not set up your profile. Please try again.",
        },
      },
    },
    sidebar: {
      standings: "Standings",
      matchHistory: "Matches",
      hallOfFame: "Hall of Fame",
      draw: "Draw",
      auctions: "Auctions",
      posts: "Forum",
    },
    season: {
      label: "Season {number}",
      allTime: "All seasons",
    },
    pages: {
      player: {
        /** A point on the rating chart whose date is unknown, by its place. */
        matchNumber: "Match {number}",
      },
      matchHistory: {
        title: "Matches",
        description: "Every match on the ladder, newest first.",
      },
      draw: {
        title: "Draw",
        description:
          "Pick ten players and draw the teams. Sides, roles and captains are random.",
        toastDuplicate: "That player is already on the roster.",
        toastInvalidRiot: "Use SummonerName#TAG (e.g. Hide on bush#KR1).",
        clearRoster: "Clear",
        generate: "Draw teams",
        reroll: "Draw again",
        picker: {
          title: "Roster",
          hint: "Add ten players from the list or by Riot ID.",
          empty: "Add ten players from the list or by Riot ID.",
          remove: "Remove",
          fromLadder: "From ladder",
          search: "Search by summoner name…",
          noResults: "No players match your search.",
          add: "Add",
          riotIdLabel: "Riot ID",
          riotIdPlaceholder: "SummonerName#TAG",
        },
      },
      auctions: {
        title: "Live auctions",
        description:
          "Two captains buy five-player teams in a public room, against a timer the server keeps.",
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
          clear: "Clear",
          cancel: "Cancel",
          create: "Create room",
          save: "Save lobby",
          saving: "Saving...",
        },
        picker: {
          title: "Player pool",
          hint: "Add eight players from the ladder or by Riot ID.",
          empty: "No available players found.",
          remove: "Remove player",
          fromLadder: "From the ladder",
          search: "Search ladder players...",
          noResults: "No available players found.",
          add: "Add",
          riotIdLabel: "Add a Riot ID",
          riotIdPlaceholder: "Game Name#TAG",
        },
        room: {
          teamB: "Team B",
          versus: "vs",
        },
        lobby: {
          starting: "Auction starts in",
          ready: "I'm ready",
          unready: "Withdraw ready",
          linkCopied: "Room link copied.",
          linkCopyFailed: "Could not copy the room link.",
        },
        errors: {
          unknown: "Something went wrong. Try again.",
          AUCTION_PROFILE_REQUIRED:
            "Create a profile before joining an auction.",
          AUCTION_REQUEST_ID_REQUIRED: "Something went wrong. Try again.",
          AUCTION_IDEMPOTENCY_KEY_REUSED: "That action was already sent.",
          AUCTION_ROOM_NOT_FOUND: "Auction not found.",
          AUCTION_ROOM_NOT_WAITING: "The lobby has closed.",
          AUCTION_ROOM_STARTED: "The auction has already started.",
          AUCTION_ROOM_TERMINAL: "This auction is over.",
          AUCTION_PERMISSION_DENIED: "You cannot do that in this auction.",
          AUCTION_ALREADY_CAPTAIN:
            "You are a captain in a live auction. Finish or cancel it first.",
          AUCTION_CAPTAIN_SLOT_TAKEN:
            "The second captain seat is already taken.",
          AUCTION_CAPTAIN_SLOT_EMPTY: "There is no second captain to remove.",
          AUCTION_NEEDS_TWO_CAPTAINS: "The auction needs two captains.",
          AUCTION_PLAYERS_INVALID:
            "The pool needs eight players, each with a Riot ID.",
          AUCTION_PLAYERS_NOT_UNIQUE: "Each Riot ID can be in the pool once.",
          AUCTION_BUDGET_INVALID: "The budget must be between 4 and 100.",
          AUCTION_BID_SECONDS_INVALID:
            "The bid timer must be between 10 and 60 seconds.",
          AUCTION_TEAM_NAME_INVALID:
            "The team name must be 1 to 100 characters.",
          AUCTION_BIDDING_CLOSED: "Bidding is not open right now.",
          AUCTION_DEADLINE_PASSED: "The bidding deadline has passed.",
          AUCTION_BID_TOO_LOW: "The bid is too low.",
          AUCTION_BUDGET_EXCEEDED: "This bid exceeds your remaining budget.",
          AUCTION_LEADER_CANNOT_BID: "You already lead this round.",
          AUCTION_CONCEDE_NOT_ALLOWED: "There is nothing to concede right now.",
          AUCTION_LEADER_CANNOT_CONCEDE:
            "You lead this round, so there is nothing to concede.",
          AUCTION_PASS_NOT_ALLOWED:
            "A pass is only possible in a free auction.",
          AUCTION_TAKE_NOT_ALLOWED: "Taking for $1 is not available right now.",
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
            failed: "Could not publish the post. Please try again.",
          },
        },
        imageUpload: {
          tooLarge: "Images must be smaller than 10 MB.",
          failed: "Could not upload the image.",
        },
        comments: {
          placeholder: "Write a comment...",
          failed: "Could not add the comment. Please try again.",
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
