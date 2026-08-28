import { HttpResponse, delay, http } from "msw"
import { posts } from "../data/posts"
import type { Post } from "../data/posts"

// Small realistic latency so loading states are actually visible in dev.
const NETWORK_DELAY_MS = 350

export const postsHandlers = [
  http.get("/api/posts", async () => {
    await delay(NETWORK_DELAY_MS)
    return HttpResponse.json(posts)
  }),

  http.post("/api/posts", async ({ request }) => {
    await delay(NETWORK_DELAY_MS)

    const body = (await request.json()) as Partial<Post>

    if (!body.title?.trim()) {
      return HttpResponse.json(
        { message: "Title is required" },
        { status: 400 }
      )
    }

    const newPost: Post = {
      id: crypto.randomUUID(),
      title: body.title,
      body: body.body ?? "",
      createdAt: new Date().toISOString(),
    }

    posts.unshift(newPost)

    return HttpResponse.json(newPost, { status: 201 })
  }),
]
