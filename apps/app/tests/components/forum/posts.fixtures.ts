/**
 * A forum post, as `forum.posts.list` returns it: what the post mappers are tested against.
 *
 * Real data from the local database with the people replaced: names, tag lines, puuids, user ids, and
 * the body rewritten because it named real players.
 * This repo is public and the local database can be a copy of production. Typed against the router
 * output, so a change to the API shape fails typecheck here instead of leaving the mappers behind.
 */
import type { RouterOutputs } from "@v1/api";

export const POSTS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Podsumowanie wczorajszego wieczoru",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Pięć meczów wczoraj, a ",
            },
            {
              type: "text",
              text: "Kestrel",
              marks: [
                {
                  type: "bold",
                },
              ],
            },
            {
              type: "text",
              text: " dalej zbiera antytytuły. Ktoś musi go w końcu zdraftować.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Najdłuższy mecz trwał 45 minut i skończył się na barona po trzech wymianach.",
            },
          ],
        },
      ],
    },
    created_at: "2026-09-19T04:28:08.733517+00:00",
    author: {
      id: "fixture-user-1",
      nickname: "Kestrel",
      avatar_url: null,
    },
    reactions: [
      {
        type: "like",
      },
      {
        type: "dislike",
      },
      {
        type: "like",
      },
      {
        type: "like",
      },
    ],
    comments: [],
    likes: 3,
    dislikes: 1,
    commentCount: 2,
  },
] satisfies RouterOutputs["forum"]["posts"]["list"]["items"];
