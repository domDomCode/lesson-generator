import { textbookHandlers } from "./textbooks"
import { planHandlers } from "./plans"
import { materialHandlers } from "./materials"
import { examHandlers } from "./exam"

export const handlers = [
  ...textbookHandlers,
  ...planHandlers,
  ...materialHandlers,
  ...examHandlers,
]
