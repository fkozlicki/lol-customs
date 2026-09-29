/**
 * Three forum posts, shaped the way recipes take them, for stories.
 *
 * The same posts as the app's router-shaped fixture (`apps/app/src/components/forum/posts.fixtures.ts`):
 * real data from the local database with the people replaced, and bodies rewritten because they named
 * real players. This repo is public and the local database can be a copy of production.
 */

/** A TipTap document, as the post body renderer takes it. */
export type TipTapDocument = Record<string, unknown>;

export interface PostFixture {
  id: string;
  title: string;
  body: TipTapDocument;
  /** What the app's `postExcerpt` makes of the body. */
  excerpt: string;
  authorName: string;
  avatarUrl: string | null;
  createdAt: string;
  likes: number;
  dislikes: number;
  commentCount: number;
}

export const POSTS: PostFixture[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Podsumowanie wczorajszego wieczoru",
    body: {
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
    excerpt:
      "Pięć meczów wczoraj, a Kestrel dalej zbiera antytytuły. Ktoś musi go w końcu zdraftować. Najdłuższy mecz trwał 45 minut i skończył się na barona po trzech wymia…",
    authorName: "Kestrel",
    avatarUrl: null,
    createdAt: "2026-09-19T04:28:08.733517+00:00",
    likes: 3,
    dislikes: 1,
    commentCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Aukcja w piątek o 20:00 — kto wchodzi?",
    body: {
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
    excerpt:
      "Zbieramy się w piątek o 20:00. Kapitanowie losowani jak zwykle. Kto wchodzi · Quill — potwierdzone · Bramble — może się spóźnić · Nightjar — do potwierdzenia",
    authorName: "Quill",
    avatarUrl: null,
    createdAt: "2026-09-18T07:28:08.733517+00:00",
    likes: 1,
    dislikes: 0,
    commentCount: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "Propozycja: sezon 3 startuje po świętach",
    body: {
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
    excerpt:
      "Propozycja: sezon 3 startuje po świętach, żeby nikt nie grał kwalifikacji z telefonu.",
    authorName: "Bramble",
    avatarUrl: null,
    createdAt: "2026-09-14T07:28:08.733517+00:00",
    likes: 0,
    dislikes: 0,
    commentCount: 0,
  },
];
