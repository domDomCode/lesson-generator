import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { usePostForm } from "../hooks/usePostForm"
import { useCreatePost } from "../mutations/useCreatePost"

export function PostForm() {
  const { title, setTitle, body, setBody, reset } = usePostForm()
  const createPost = useCreatePost()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    createPost.mutate(
      { title, body },
      {
        onSuccess: reset,
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New post</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {createPost.isError && (
            <p className="text-destructive text-sm">
              {createPost.error instanceof Error
                ? createPost.error.message
                : "Failed to create post"}
            </p>
          )}
          <Button type="submit" disabled={createPost.isPending}>
            {createPost.isPending ? "Creating…" : "Create post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
