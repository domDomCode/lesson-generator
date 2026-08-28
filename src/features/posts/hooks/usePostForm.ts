import { useState } from "react"

export function usePostForm() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  function reset() {
    setTitle("")
    setBody("")
  }

  return { title, setTitle, body, setBody, reset }
}
