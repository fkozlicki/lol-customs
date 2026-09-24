/**
 * Three forum posts, for stories.
 *
 * Real data from the local database with the people replaced: names, tag lines, puuids, user ids, and post bodies rewritten because
 * they named real players.
 * This repo is public and the local database can be a copy of production. Typed against the router
 * output, so a change to the API shape fails typecheck here instead of leaving the stories behind.
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
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Aukcja w piątek o 20:00 — kto wchodzi?",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Zbieramy się w piątek o 20:00. Kapitanowie losowani jak zwykle.",
            },
          ],
        },
        {
          type: "heading",
          attrs: {
            level: 2,
          },
          content: [
            {
              type: "text",
              text: "Kto wchodzi",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Quill — potwierdzone",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Bramble — może się spóźnić",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Nightjar — do potwierdzenia",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    created_at: "2026-09-18T07:28:08.733517+00:00",
    author: {
      id: "fixture-user-2",
      nickname: "Quill",
      avatar_url: null,
    },
    reactions: [
      {
        type: "like",
      },
    ],
    comments: [],
    likes: 1,
    dislikes: 0,
    commentCount: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "Propozycja: sezon 3 startuje po świętach",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Propozycja: ",
            },
            {
              type: "text",
              text: "sezon 3",
              marks: [
                {
                  type: "italic",
                },
              ],
            },
            {
              type: "text",
              text: " startuje po świętach, żeby nikt nie grał kwalifikacji z telefonu.",
            },
          ],
        },
      ],
    },
    created_at: "2026-09-14T07:28:08.733517+00:00",
    author: {
      id: "fixture-user-3",
      nickname: "Bramble",
      avatar_url: null,
    },
    reactions: [],
    comments: [],
    likes: 0,
    dislikes: 0,
    commentCount: 0,
  },
] satisfies RouterOutputs["forum"]["posts"]["list"]["items"];
