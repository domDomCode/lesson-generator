import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { usePosts } from "../queries/usePosts"

export function PostList() {
  const { data: posts, isLoading, isError, error } = usePosts()

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading posts…</p>
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error instanceof Error ? error.message : "Something went wrong"}
      </p>
    )
  }

  if (!posts?.length) {
    return <p className="text-muted-foreground text-sm">No posts yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>
              {new Date(post.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>{post.body}</CardContent>
        </Card>
      ))}
    </div>
  )
}
