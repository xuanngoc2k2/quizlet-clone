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

// ─── Draw 원고지 grid onto a canvas context ────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number; pressure?: number }

type Stroke = {
  points: Point[]
  width: number
  color: string
}

export type CanvasHandwritingHandle = {
  /** Returns null if canvas is blank (no strokes) */
  exportJpeg: () => string | null
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /** All committed strokes */
  const strokesRef = useRef<Stroke[]>([])
  /** Current in-progress stroke */
  const currentRef = useRef<Point[]>([])
  const isDrawingRef = useRef(false)

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

  // ── Initial grid draw ─────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawGrid(ctx, rows, canvasW, canvasH)
  }, [rows, canvasW, canvasH])

  // ─── Redraw: grid + all strokes + current stroke ──────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawGrid(ctx, rows, canvasW, canvasH)

    // Committed strokes
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = stroke.width
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i]
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
    }

    // In-progress stroke
    const cur = currentRef.current
    if (cur.length >= 2) {
      ctx.beginPath()
      ctx.strokeStyle = tool === "eraser" ? COLOR_CELL_BG : COLOR_INK
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = tool === "eraser" ? penWidth * 6 : penWidth
      ctx.moveTo(cur[0].x, cur[0].y)
      for (let i = 1; i < cur.length; i++) {
        ctx.lineTo(cur[i].x, cur[i].y)
      }
      ctx.stroke()
    }
  }, [tool, penWidth, rows, canvasW, canvasH])

  // ─── Pointer event helpers ────────────────────────────────────────────────

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    // rect size = canvas CSS size (scale * canvasW); canvas pixel size = canvasW
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
      e.preventDefault()
      ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
      isDrawingRef.current = true
      currentRef.current = [canvasPoint(e)]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasW, canvasH],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      e.preventDefault()
      currentRef.current.push(canvasPoint(e))
      redraw()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [redraw, canvasW, canvasH],
  )

  const commitStroke = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const pts = currentRef.current
    currentRef.current = []
    if (pts.length < 2) return

    strokesRef.current.push({
      points: pts,
      width: tool === "eraser" ? penWidth * 6 : penWidth,
      color: tool === "eraser" ? COLOR_CELL_BG : COLOR_INK,
    })
    setHasStrokes(true)
    redraw()
  }, [tool, penWidth, redraw])

  // ─── Toolbar actions ──────────────────────────────────────────────────────

  function handleUndo() {
    if (strokesRef.current.length === 0) return
    strokesRef.current.pop()
    if (strokesRef.current.length === 0) setHasStrokes(false)
    redraw()
  }

  function handleClear() {
    strokesRef.current = []
    currentRef.current = []
    setHasStrokes(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawGrid(ctx, rows, canvasW, canvasH)
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  function handleExtract() {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes) return
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    const base64 = dataUrl.split(",")[1] ?? ""
    onExtract(base64, "image/jpeg", dataUrl)
  }

  // ─── Width presets ────────────────────────────────────────────────────────
  const widths = [1.5, 2.5, 4]

  // ─── Render ───────────────────────────────────────────────────────────────
  const displayW = Math.round(canvasW * scale)
  const displayH = Math.round(canvasH * scale)

  return (
    <div className="space-y-3">
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

      {/* Canvas container */}
      <div ref={containerRef} className="w-full">
        <div
          className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm"
          style={{ width: "100%" }}
        >
          {/* Extra right padding for row markers */}
          <div className="inline-block pr-10">
            <canvas
              ref={canvasRef}
              width={canvasW}
              height={canvasH}
              style={{
                display: "block",
                width: displayW,
                height: displayH,
                cursor: tool === "eraser" ? "cell" : "crosshair",
                touchAction: "none",
              }}
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
