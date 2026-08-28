export interface Post {
  id: string
  title: string
  body: string
  createdAt: string
}

// In-memory "database" for the posts mock. Mutated by the handlers so
// creates/reads behave like a real (if very small) backend during dev.
export const posts: Post[] = [
  {
    id: "1",
    title: "Welcome to the mock backend",
    body: "This post is served by MSW from mock-backend/data/posts.ts — no real server involved.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "2",
    title: "Feature-based structure",
    body: "Each feature owns its own components, hooks, queries and mutations.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]
