import { useRef, useState, type RefObject } from "react"
import { Search } from "lucide-react"

import { Input } from "@/shared/ui/input"
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet"

import { useTextbookSearch } from "../../data/textbooks"
import type { Textbook } from "../../model/types"
import { useDebouncedValue } from "./useDebouncedValue"

interface TextbookSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (textbook: Textbook) => void
}

/**
 * Bottom sheet with live textbook search. The search state lives in an
 * inner component mounted with the sheet content, so each opening starts
 * with a fresh, focused search field and no query runs while closed.
 */
export function TextbookSheet({ open, onOpenChange, onSelect }: TextbookSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="h-[75svh]"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <SheetHeader>
          <SheetTitle>Wybierz podręcznik</SheetTitle>
        </SheetHeader>
        <TextbookSearch inputRef={inputRef} onSelect={onSelect} />
      </SheetContent>
    </Sheet>
  )
}

function TextbookSearch({
  inputRef,
  onSelect,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onSelect: (textbook: Textbook) => void
}) {
  const [search, setSearch] = useState("")
  const q = useDebouncedValue(search, 250)
  const { data, isPending, isError } = useTextbookSearch(q)

  return (
    <>
      <div className="px-4 pb-2">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Szukaj po tytule lub wydawcy"
            className="h-11 pl-9"
          />
        </div>
      </div>
      <SheetBody className="pt-1">
        {isPending ? (
          <div className="flex flex-col gap-2" aria-hidden>
            <div className="shimmer h-12 rounded-lg" />
            <div className="shimmer h-12 rounded-lg" />
            <div className="shimmer h-12 rounded-lg" />
          </div>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Coś poszło nie tak. Spróbuj ponownie.
          </p>
        ) : data && data.length > 0 ? (
          <ul className="flex flex-col">
            {data.map((textbook) => (
              <li key={textbook.id}>
                <button
                  type="button"
                  onClick={() => onSelect(textbook)}
                  className="flex min-h-11 w-full flex-col justify-center gap-0.5 rounded-lg px-2 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
                >
                  <span className="text-sm font-medium">{textbook.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {textbook.publisher} · {textbook.subject}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nie znalazłem takiego podręcznika. Spróbuj innej nazwy.
          </p>
        )}
      </SheetBody>
    </>
  )
}
