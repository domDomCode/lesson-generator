import { createRoute } from "@tanstack/react-router"

import { rootRoute } from "@/app/routes/root"
import { DialogDemo } from "@/features/demo/components/DialogDemo"
import { PostForm } from "@/features/posts/components/PostForm"
import { PostList } from "@/features/posts/components/PostList"

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-muted-foreground text-sm">
            Demo feature backed by the MSW mock backend.
          </p>
        </div>
        <DialogDemo />
      </header>
      <PostForm />
      <PostList />
    </div>
  )
}
