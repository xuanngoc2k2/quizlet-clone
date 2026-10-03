"use client"

import {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react"

// ─── Constants ────────────────────────────────────────────────────────────────

const COLS = 25
const ROWS = 12
const TOTAL = COLS * ROWS // 300

// Right-side markers: every 2 rows (every 50 chars)
// Shown at the bottom edge of rows 1, 3, 5, 7, 9, 11 (0-indexed)
const MARKER_ROWS: Record<number, string> = {
  1: "50",
  3: "100",
  5: "150",
  7: "200",
  9: "250",
  11: "300",
}

// ─── State / Reducer ──────────────────────────────────────────────────────────

type EditorState = {
  /** Array of actual logical cells. Padded with "" visually up to 300. */
  cells: string[]
  cursorIndex: number
  composingText: string
}

const makeInitialState = (): EditorState => ({
  cells: [" "],
  cursorIndex: 1,
  composingText: "",
})

type EditorAction =
  | { type: "TYPE"; char: string }
  | { type: "BACKSPACE" }
  | { type: "DELETE" }
  | { type: "SET_CURSOR"; index: number }
  | { type: "MOVE"; delta: number }
  | { type: "MOVE_ROW"; delta: number }
  | { type: "ROW_HOME" }
  | { type: "ROW_END" }
  | { type: "ENTER" }
  | { type: "COMPOSE"; text: string }
  | { type: "RESET" }

function reducer(state: EditorState, action: EditorAction): EditorState {
  const { cells, cursorIndex } = state

  switch (action.type) {
    case "TYPE": {
      if (!action.char || action.char === "\n" || action.char === "\r") return state
      const char = action.char.normalize("NFC")

      // Space is always an INSERT operation (shifts cells right)
      if (char === " ") {
        if (cells.length >= TOTAL) return state // Do not exceed limit
        const next = [...cells]
        next.splice(cursorIndex, 0, " ")
        return { ...state, cells: next, cursorIndex: cursorIndex + 1 }
      }

      // 1. Digit grouping rule
      if (/\d/.test(char) && cursorIndex > 0) {
        const prev = cells[cursorIndex - 1]
        // If previous is exactly 1 digit, we group them into 1 cell
        if (/^\d$/.test(prev)) {
          const next = [...cells]
          next[cursorIndex - 1] = prev + char
          return { ...state, cells: next }
        }
      }

      // 2. Overtype/Replace insert for normal characters
      if (cells.length >= TOTAL && cursorIndex >= cells.length) return state
      const next = [...cells]
      if (cursorIndex < next.length) {
        next[cursorIndex] = char
      } else {
        next.push(char)
      }
      return { ...state, cells: next, cursorIndex: cursorIndex + 1 }
    }
    case "BACKSPACE": {
      if (cursorIndex > 0) {
        const next = [...cells]
        next.splice(cursorIndex - 1, 1)
        return { ...state, cells: next, cursorIndex: cursorIndex - 1 }
      }
      return state
    }
    case "DELETE": {
      if (cursorIndex < cells.length) {
        const next = [...cells]
        next.splice(cursorIndex, 1)
        return { ...state, cells: next }
      }
      return state
    }
    case "SET_CURSOR":
      return { ...state, cursorIndex: Math.max(0, Math.min(cells.length, action.index)) }
    case "MOVE":
      return {
        ...state,
        cursorIndex: Math.max(0, Math.min(cells.length, cursorIndex + action.delta)),
      }
    case "MOVE_ROW":
      return {
        ...state,
        cursorIndex: Math.max(
          0,
          Math.min(cells.length, cursorIndex + action.delta * COLS),
        ),
      }
    case "ROW_HOME":
      return { ...state, cursorIndex: Math.floor(cursorIndex / COLS) * COLS }
    case "ROW_END":
      return {
        ...state,
        cursorIndex: Math.min(cells.length, Math.floor(cursorIndex / COLS) * COLS + COLS - 1),
      }
    case "ENTER": {
      const currentCol = cursorIndex % COLS
      const padNeeded = COLS - currentCol
      if (cells.length + padNeeded > TOTAL) return state
      const next = [...cells]
      const pads = Array(padNeeded).fill("")
      next.splice(cursorIndex, 0, ...pads)
      return { ...state, cells: next, cursorIndex: cursorIndex + padNeeded }
    }
    case "COMPOSE":
      return { ...state, composingText: action.text.normalize("NFC") }
    case "RESET":
      return makeInitialState()
    default:
      return state
  }
}

// ─── Exported ref handle ──────────────────────────────────────────────────────

export type WongojipEditorHandle = {
  reset: () => void
  getCells: () => string[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type WongojipEditorProps = {
  disabled?: boolean
  onCellsChange?: (cells: string[]) => void
  errors?: Record<number, string>
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WongojipEditor = forwardRef<WongojipEditorHandle, WongojipEditorProps>(
  function WongojipEditor({ disabled = false, onCellsChange, errors }, ref) {
    const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)
    const { cells, cursorIndex, composingText } = state

    const isComposingRef = useRef(false)
    const hiddenInputRef = useRef<HTMLInputElement>(null)

    const cellCount = useMemo(() => cells.filter((c) => c !== "").length, [cells])

    // Expose reset / getCells to parent
    useImperativeHandle(ref, () => ({
      reset: () => dispatch({ type: "RESET" }),
      getCells: () => {
        const padded = [...cells]
        while (padded.length < TOTAL) padded.push("")
        if (padded.length > TOTAL) padded.length = TOTAL
        return padded
      },
    }))

    // Notify parent on cells change
    useEffect(() => {
      const padded = [...cells]
      while (padded.length < TOTAL) padded.push("")
      if (padded.length > TOTAL) padded.length = TOTAL
      onCellsChange?.(padded)
    }, [cells, onCellsChange])

    // Native "input" event — handles non-IME keypresses (space, numbers, latin, etc.)
    // We use the native event (not React onChange) for reliable character capture.
    useEffect(() => {
      const el = hiddenInputRef.current
      if (!el) return

      function onInput() {
        if (isComposingRef.current) return
        const val = el!.value
        if (!val) return
        for (const ch of val) {
          dispatch({ type: "TYPE", char: ch })
        }
        el!.value = "" // reset after processing
      }

      el.addEventListener("input", onInput)
      return () => el.removeEventListener("input", onInput)
    }, []) // dispatch is stable from useReducer

    // Keyboard navigation (arrows, backspace, delete, enter, home, end)
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return // IME controls keyboard during composition

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault()
            dispatch({ type: "MOVE", delta: -1 })
            break
          case "ArrowRight":
            e.preventDefault()
            dispatch({ type: "MOVE", delta: 1 })
            break
          case "ArrowUp":
            e.preventDefault()
            dispatch({ type: "MOVE_ROW", delta: -1 })
            break
          case "ArrowDown":
            e.preventDefault()
            dispatch({ type: "MOVE_ROW", delta: 1 })
            break
          case "Home":
            e.preventDefault()
            dispatch({ type: "ROW_HOME" })
            break
          case "End":
            e.preventDefault()
            dispatch({ type: "ROW_END" })
            break
          case "Enter":
            e.preventDefault()
            dispatch({ type: "ENTER" })
            break
          case "Backspace":
            e.preventDefault()
            dispatch({ type: "BACKSPACE" })
            break
          case "Delete":
            e.preventDefault()
            dispatch({ type: "DELETE" })
            break
        }
      },
      [],
    )

    // Korean IME composition events
    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true
    }, [])

    const handleCompositionUpdate = useCallback(
      (e: React.CompositionEvent<HTMLInputElement>) => {
        dispatch({ type: "COMPOSE", text: e.data || "" })
      },
      [],
    )

    const handleCompositionEnd = useCallback(
      (e: React.CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false
        dispatch({ type: "COMPOSE", text: "" })
        // Reset hidden input value to clear composed text
        if (hiddenInputRef.current) hiddenInputRef.current.value = ""
        // Insert the final composed character
        if (e.data) {
          dispatch({ type: "TYPE", char: e.data })
        }
      },
      [],
    )

    function focusInput() {
      if (!disabled) hiddenInputRef.current?.focus()
    }

    // Build the array of 300 cells to render
    const displayCells = [...cells]
    if (isComposingRef.current && composingText) {
      if (cursorIndex < displayCells.length) {
        displayCells[cursorIndex] = composingText
      } else {
        displayCells.push(composingText)
      }
    }
    while (displayCells.length < TOTAL) displayCells.push("")
    if (displayCells.length > TOTAL) displayCells.length = TOTAL

    return (
      <div className="select-none">
        {/* Header bar */}
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-400">
          <span>25 ô × 12 dòng</span>
          <span>{cellCount} / 300 ô</span>
        </div>

        {/* Grid wrapper — allows horizontal scroll on narrow screens */}
        <div className="w-full overflow-x-auto rounded-lg pb-4">
          <div
            className="writing-editor relative border-2 border-gray-500 bg-white w-max"
            onClick={focusInput}
          >
            {/* Hidden input — captures all keyboard input including Korean IME */}
            {/* Must have exactly matching typography classes so IME popup scales correctly */}
            <input
              ref={hiddenInputRef}
              className="writing-ime-input absolute opacity-0 pointer-events-none text-xs md:text-sm lg:text-base font-medium leading-none"
              style={{ width: 1, height: 1, top: 0, left: 0 }}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionUpdate={handleCompositionUpdate}
              onCompositionEnd={handleCompositionEnd}
              readOnly={disabled}
              aria-label="원고지 입력"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            {/* Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, max-content)`,
                gridAutoRows: "max-content",
              }}
            >
              {displayCells.map((displayChar, i) => {
                const row = Math.floor(i / COLS)
                const col = i % COLS

                const isCursor = !disabled && i === cursorIndex
                const isComposingCell = isCursor && isComposingRef.current

                // Major dividers every 5 cols and every 4 rows
                const isMajorRight = col === 4 || col === 9 || col === 14 || col === 19
                const isMajorBottom = row === 3 || row === 7
                const errorMsg = errors?.[i]

                return (
                  <div
                    key={i}
                    onClick={(e) => {
                      if (disabled) return
                      e.stopPropagation()
                      dispatch({ type: "SET_CURSOR", index: i })
                      focusInput()
                    }}
                    className={[
                      "writing-cell box-border relative flex items-center justify-center",
                      "w-[26px] h-[26px] md:w-[28px] md:h-[28px] lg:w-[32px] lg:h-[32px]",
                      "text-xs md:text-sm lg:text-base font-medium",
                      col !== COLS - 1 ? (isMajorRight ? "border-r-2 border-r-gray-500" : "border-r border-r-gray-200") : "",
                      row !== ROWS - 1 ? (isMajorBottom ? "border-b-2 border-b-gray-500" : "border-b border-b-gray-200") : "",
                      isCursor ? "bg-blue-50 ring-2 ring-inset ring-blue-400 z-10" :
                        errorMsg ? "bg-red-50 ring-1 ring-inset ring-red-400 z-10" : "bg-white",
                      disabled ? "cursor-default" : "cursor-text",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={errorMsg}
                  >
                    <span
                      className={[
                        "leading-none",
                        isComposingCell ? "text-blue-500 underline decoration-dotted" :
                          errorMsg ? "text-red-700" : "text-gray-900",
                      ].filter(Boolean).join(" ")}
                    >
                      {displayChar}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Right-side row markers (50, 100, ..., 300) */}
            <div className="pointer-events-none absolute inset-y-0 -right-9 flex flex-col">
              {Array.from({ length: ROWS }, (_, row) => (
                <div
                  key={row}
                  className="flex flex-1 items-end justify-start pb-1 pl-1"
                >
                  {MARKER_ROWS[row] && (
                    <span className="text-[10px] leading-none text-gray-400 font-mono">
                      {MARKER_ROWS[row]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Counter */}
        <p className="mt-2 text-xs text-gray-500">
          {cellCount} ô đã dùng · tối đa 300 ô
        </p>
      </div>
    )
  },
)
