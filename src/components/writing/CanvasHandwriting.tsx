"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Eraser, Undo2, Trash2, Pen } from "lucide-react"
import { Button } from "@/components/ui/Button"

// ─── Constants ────────────────────────────────────────────────────────────────

/** 원고지 layout constants */
const COLS = 25
const DEFAULT_ROWS = 12 // 300 cells for Q53

/** Pixel size of each cell on canvas */
const CELL = 36

const MAJOR_EVERY_COL = 5 // thicker border every N cols
const MAJOR_EVERY_ROW = 4 // thicker border every N rows

// Colors
const COLOR_CELL_BG = "#ffffff"
const COLOR_GRID_MINOR = "#d1d5db" // gray-300
const COLOR_GRID_MAJOR = "#6b7280" // gray-500
const COLOR_INK = "#1a1a1a"

// ─── Draw 원고지 grid onto background canvas ──────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, totalRows: number, canvasW: number, canvasH: number) {
  ctx.fillStyle = COLOR_CELL_BG
  ctx.fillRect(0, 0, canvasW, canvasH)

  for (let row = 0; row <= totalRows; row++) {
    const y = row * CELL
    const isMajorRow = row % MAJOR_EVERY_ROW === 0
    ctx.beginPath()
    ctx.strokeStyle = isMajorRow ? COLOR_GRID_MAJOR : COLOR_GRID_MINOR
    ctx.lineWidth = isMajorRow ? 1.5 : 0.7
    ctx.moveTo(0, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }

  for (let col = 0; col <= COLS; col++) {
    const x = col * CELL
    const isMajorCol = col % MAJOR_EVERY_COL === 0
    ctx.beginPath()
    ctx.strokeStyle = isMajorCol ? COLOR_GRID_MAJOR : COLOR_GRID_MINOR
    ctx.lineWidth = isMajorCol ? 1.5 : 0.7
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvasH)
    ctx.stroke()
  }

  // Row count labels on right side (25, 50, …)
  ctx.fillStyle = "#9ca3af"
  ctx.font = `10px monospace`
  ctx.textAlign = "left"
  ctx.textBaseline = "bottom"
  for (let row = 0; row < totalRows; row++) {
    const label = String((row + 1) * COLS)
    ctx.fillText(label, canvasW + 4, (row + 1) * CELL - 2)
  }
}

// ─── Draw a smooth stroke (with quadratic bezier curves or dot) ───────────────

function renderStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  width: number,
  isEraser: boolean,
) {
  if (pts.length === 0) return

  ctx.save()
  if (isEraser) {
    ctx.globalCompositeOperation = "destination-out"
    ctx.strokeStyle = "rgba(0,0,0,1)"
    ctx.fillStyle = "rgba(0,0,0,1)"
  } else {
    ctx.globalCompositeOperation = "source-over"
    ctx.strokeStyle = COLOR_INK
    ctx.fillStyle = COLOR_INK
  }
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.lineWidth = width

  // If single tap / dot
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }

  // If 2 points, simple line
  if (pts.length === 2) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[1].x, pts[1].y)
    ctx.stroke()
    ctx.restore()
    return
  }

  // Smooth curve through points using midpoints
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)

  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2
    const yc = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc)
  }

  // Last segment
  const last = pts[pts.length - 1]
  const secondLast = pts[pts.length - 2]
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y)
  ctx.stroke()
  ctx.restore()
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number; pressure?: number }

type Stroke = {
  points: Point[]
  width: number
  isEraser: boolean
}

type Props = {
  /** Maximum number of cells (e.g. 300 for Q53, 700 for Q54) */
  maxCells?: number
  /** Called when user explicitly requests extraction */
  onExtract: (_base64: string, _mimeType: string, _previewDataUrl: string) => void
  isLoading?: boolean
  /** Label for the extract button */
  extractLabel?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CanvasHandwriting({
  maxCells = 300,
  onExtract,
  isLoading,
  extractLabel = "Trích xuất chữ viết",
}: Props) {
  const rows = Math.ceil(maxCells / COLS) || DEFAULT_ROWS
  const canvasW = COLS * CELL // 900px
  const canvasH = rows * CELL // 432px for 12 rows, 1008px for 28 rows

  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /** All committed strokes */
  const strokesRef = useRef<Stroke[]>([])
  /** Current in-progress stroke */
  const currentRef = useRef<Point[]>([])
  const isDrawingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const penDetectedRef = useRef(false)

  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [penWidth, setPenWidth] = useState(2.5)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [scale, setScale] = useState(1)

  // ── Scale canvas to container width ──────────────────────────────────────

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const containerW = containerRef.current.clientWidth
      setScale(Math.min(1, containerW / canvasW))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [canvasW])

  // ── Initial grid draw onto background canvas ──────────────────────────────

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current
    if (!gridCanvas) return
    const ctx = gridCanvas.getContext("2d")
    if (!ctx) return
    drawGrid(ctx, rows, canvasW, canvasH)
  }, [rows, canvasW, canvasH])

  // ─── Redraw drawing canvas: all strokes + current stroke ──────────────────

  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear entire transparent drawing layer
    ctx.clearRect(0, 0, canvasW, canvasH)

    // Render committed strokes with smooth curve
    for (const stroke of strokesRef.current) {
      renderStroke(ctx, stroke.points, stroke.width, stroke.isEraser)
    }

    // In-progress stroke
    const cur = currentRef.current
    if (cur.length > 0) {
      renderStroke(
        ctx,
        cur,
        tool === "eraser" ? penWidth * 6 : penWidth,
        tool === "eraser",
      )
    }
  }, [tool, penWidth, canvasW, canvasH])

  // ─── Native touch prevention for iOS Safari ───────────────────────────────

  useEffect(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return

    // iOS Safari ignores e.preventDefault() on passive listeners.
    // Adding non-passive touch listeners completely stops iOS Safari from initiating text selection or scrolling on the canvas.
    function preventTouch(e: TouchEvent) {
      e.preventDefault()
    }

    canvas.addEventListener("touchstart", preventTouch, { passive: false })
    canvas.addEventListener("touchmove", preventTouch, { passive: false })
    canvas.addEventListener("touchend", preventTouch, { passive: false })
    canvas.addEventListener("touchcancel", preventTouch, { passive: false })

    return () => {
      canvas.removeEventListener("touchstart", preventTouch)
      canvas.removeEventListener("touchmove", preventTouch)
      canvas.removeEventListener("touchend", preventTouch)
      canvas.removeEventListener("touchcancel", preventTouch)
    }
  }, [])

  // ─── Pointer event helpers ────────────────────────────────────────────────

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = drawCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasW / rect.width
    const scaleY = canvasH / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure,
    }
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // 1. Strict Palm Rejection:
      // If Apple Pencil ("pen") is used, completely ignore touch/palm contact ("touch")
      if (e.pointerType === "pen") {
        penDetectedRef.current = true
      } else if (penDetectedRef.current && e.pointerType === "touch") {
        // Lòng bàn tay chạm vào khi đang dùng bút vẽ -> loại bỏ hoàn toàn
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // If already drawing with a pointer, ignore any additional simultaneous pointer (palm/fingers)
      if (isDrawingRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()

      try {
        ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
      } catch {
        // Safe fallback
      }

      activePointerIdRef.current = e.pointerId
      isDrawingRef.current = true
      currentRef.current = [canvasPoint(e)]
      redrawStrokes()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasW, canvasH, redrawStrokes],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // If an active stroke is drawing, discard any other pointer (e.g. palm resting)
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      // Lấy tất cả các điểm coalesced events nếu có (Apple Pencil 120Hz/240Hz sampling)
      const nativeEvent = e.nativeEvent as PointerEvent
      if (typeof nativeEvent.getCoalescedEvents === "function") {
        const events = nativeEvent.getCoalescedEvents()
        if (events && events.length > 0) {
          const canvas = drawCanvasRef.current!
          const rect = canvas.getBoundingClientRect()
          const scaleX = canvasW / rect.width
          const scaleY = canvasH / rect.height
          for (const ev of events) {
            currentRef.current.push({
              x: (ev.clientX - rect.left) * scaleX,
              y: (ev.clientY - rect.top) * scaleY,
              pressure: ev.pressure,
            })
          }
          redrawStrokes()
          return
        }
      }

      currentRef.current.push(canvasPoint(e))
      redrawStrokes()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [redrawStrokes, canvasW, canvasH],
  )

  const commitStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

      isDrawingRef.current = false
      activePointerIdRef.current = null

      try {
        if ((e.target as HTMLCanvasElement).hasPointerCapture(e.pointerId)) {
          ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
        }
      } catch {
        // Safe fallback
      }

      const pts = currentRef.current
      currentRef.current = []
      if (pts.length === 0) return

      strokesRef.current.push({
        points: pts,
        width: tool === "eraser" ? penWidth * 6 : penWidth,
        isEraser: tool === "eraser",
      })
      setHasStrokes(true)
      redrawStrokes()
    },
    [tool, penWidth, redrawStrokes],
  )

  // ─── Toolbar actions ──────────────────────────────────────────────────────

  function handleUndo() {
    if (strokesRef.current.length === 0) return
    strokesRef.current.pop()
    if (strokesRef.current.length === 0) setHasStrokes(false)
    redrawStrokes()
  }

  function handleClear() {
    strokesRef.current = []
    currentRef.current = []
    setHasStrokes(false)
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvasW, canvasH)
  }

  // ─── Export (Merge Grid + Drawing onto one Canvas) ─────────────────────────

  function handleExtract() {
    const gridCanvas = gridCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!gridCanvas || !drawCanvas || !hasStrokes) return

    // Create temporary offscreen canvas to merge
    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = canvasW
    exportCanvas.height = canvasH
    const expCtx = exportCanvas.getContext("2d")
    if (!expCtx) return

    // 1. Draw grid background
    expCtx.drawImage(gridCanvas, 0, 0)
    // 2. Draw user strokes on top
    expCtx.drawImage(drawCanvas, 0, 0)

    const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92)
    const base64 = dataUrl.split(",")[1] ?? ""
    onExtract(base64, "image/jpeg", dataUrl)
  }

  // ─── Width presets ────────────────────────────────────────────────────────
  const widths = [1.5, 2.5, 4]

  // ─── Render ───────────────────────────────────────────────────────────────
  const displayW = Math.round(canvasW * scale)
  const displayH = Math.round(canvasH * scale)

  return (
    <div className="select-none space-y-3" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pen / Eraser toggle */}
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setTool("pen")}
            aria-pressed={tool === "pen"}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              tool === "pen"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            <Pen className="h-3.5 w-3.5" />
            Bút
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            aria-pressed={tool === "eraser"}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              tool === "eraser"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            <Eraser className="h-3.5 w-3.5" />
            Tẩy
          </button>
        </div>

        {/* Pen width */}
        <div className="flex items-center gap-1.5">
          {widths.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setPenWidth(w)}
              title={`Nét ${w}px`}
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                penWidth === w
                  ? "border-primary-400 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >
              <span
                className="rounded-full bg-slate-800"
                style={{ width: w * 2.5, height: w * 2.5 }}
              />
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Undo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!hasStrokes}
          title="Hoàn tác nét vừa vẽ"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasStrokes}
          title="Xóa tất cả"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas container with stacked layers */}
      <div ref={containerRef} className="w-full">
        <div
          className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm"
          style={{
            width: "100%",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Extra right padding for row markers */}
          <div
            className="relative inline-block select-none pr-10"
            style={{
              width: displayW + 40,
              height: displayH,
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {/* Layer 1: Background Grid */}
            <canvas
              ref={gridCanvasRef}
              width={canvasW}
              height={canvasH}
              className="pointer-events-none absolute left-0 top-0 select-none"
              style={{
                width: displayW,
                height: displayH,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              aria-hidden="true"
            />

            {/* Layer 2: Drawing Ink Layer */}
            <canvas
              ref={drawCanvasRef}
              width={canvasW}
              height={canvasH}
              className="absolute left-0 top-0 select-none"
              style={{
                width: displayW,
                height: displayH,
                cursor: tool === "eraser" ? "cell" : "crosshair",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
              }}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={commitStroke}
              onPointerLeave={commitStroke}
              onPointerCancel={commitStroke}
              aria-label="Khu vực viết tay 원고지"
            />
          </div>
        </div>
      </div>

      {/* Extract button */}
      <Button
        type="button"
        variant="gradient"
        size="lg"
        className="w-full"
        onClick={handleExtract}
        disabled={!hasStrokes || isLoading}
        loading={isLoading}
      >
        {extractLabel}
      </Button>

      <p className="text-center text-[11px] text-slate-400">
        Mỗi ô = 1 ký tự ({COLS} ô × {rows} dòng = {COLS * rows} ô) · Viết 1 chữ / ô · AI sẽ OCR và trích xuất chữ viết
      </p>
    </div>
  )
}
