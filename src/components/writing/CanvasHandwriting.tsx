"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Eraser, Undo2, Trash2, Pen, ZoomIn, ZoomOut, RotateCcw, Hand } from "lucide-react"
import { Button } from "@/components/ui/Button"

// ─── Constants ────────────────────────────────────────────────────────────────

/** 원고지 layout constants */
const COLS = 25
const DEFAULT_ROWS = 12 // 300 cells for Q53

/** Pixel size of each cell on canvas (CSS pixels) */
const CELL = 36

const MAJOR_EVERY_COL = 5 // thicker border every N cols
const MAJOR_EVERY_ROW = 4 // thicker border every N rows

// Colors
const COLOR_CELL_BG = "#ffffff"
const COLOR_GRID_MINOR = "#d1d5db" // gray-300
const COLOR_GRID_MAJOR = "#6b7280" // gray-500
const COLOR_INK = "#111827" // deep sharp black (gray-900)

// ─── Draw 원고지 grid onto background canvas ──────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  totalRows: number,
  canvasW: number,
  canvasH: number,
  dpr: number,
) {
  ctx.save()
  ctx.scale(dpr, dpr)

  ctx.fillStyle = COLOR_CELL_BG
  ctx.fillRect(0, 0, canvasW, canvasH)

  for (let row = 0; row <= totalRows; row++) {
    const y = row * CELL
    const isMajorRow = row % MAJOR_EVERY_ROW === 0
    ctx.beginPath()
    ctx.strokeStyle = isMajorRow ? COLOR_GRID_MAJOR : COLOR_GRID_MINOR
    ctx.lineWidth = isMajorRow ? 1.5 : 0.75
    ctx.moveTo(0, y)
    ctx.lineTo(canvasW, y)
    ctx.stroke()
  }

  for (let col = 0; col <= COLS; col++) {
    const x = col * CELL
    const isMajorCol = col % MAJOR_EVERY_COL === 0
    ctx.beginPath()
    ctx.strokeStyle = isMajorCol ? COLOR_GRID_MAJOR : COLOR_GRID_MINOR
    ctx.lineWidth = isMajorCol ? 1.5 : 0.75
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

  ctx.restore()
}

// ─── Draw a smooth stroke (with quadratic bezier curves or dot) ───────────────

function renderStroke(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  width: number,
  isEraser: boolean,
  dpr: number,
) {
  if (pts.length === 0) return

  ctx.save()
  ctx.scale(dpr, dpr)

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  /** All committed strokes */
  const strokesRef = useRef<Stroke[]>([])
  /** Current in-progress stroke */
  const currentRef = useRef<Point[]>([])
  const isDrawingRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const penDetectedRef = useRef(false)

  // Drag-scroll tracking state (for pan tool)
  const isPanDraggingRef = useRef(false)
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null)

  const [tool, setTool] = useState<"pen" | "eraser" | "pan">("pen")
  const [penWidth, setPenWidth] = useState(2.5)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [dpr, setDpr] = useState(2)
  const [zoom, setZoom] = useState(1) // User controlled zoom: 0.65x -> 2.0x

  // ── Determine Retina DevicePixelRatio ──────────────────────────────────────

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDpr(Math.max(2, Math.min(3, window.devicePixelRatio || 2)))
    }
  }, [])

  // ── Initial grid draw onto background canvas (Retina scaled) ──────────────

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current
    if (!gridCanvas) return
    const ctx = gridCanvas.getContext("2d")
    if (!ctx) return

    gridCanvas.width = canvasW * dpr
    gridCanvas.height = canvasH * dpr

    drawGrid(ctx, rows, canvasW, canvasH, dpr)
  }, [rows, canvasW, canvasH, dpr])

  // ─── Setup drawing canvas bitmap buffer ────────────────────────────────────

  useEffect(() => {
    const drawCanvas = drawCanvasRef.current
    if (!drawCanvas) return
    drawCanvas.width = canvasW * dpr
    drawCanvas.height = canvasH * dpr
  }, [canvasW, canvasH, dpr])

  // ─── Redraw drawing canvas: all strokes + current stroke ──────────────────

  const redrawStrokes = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokesRef.current) {
      renderStroke(ctx, stroke.points, stroke.width, stroke.isEraser, dpr)
    }

    const cur = currentRef.current
    if (cur.length > 0) {
      renderStroke(
        ctx,
        cur,
        tool === "eraser" ? penWidth * 6 : penWidth,
        tool === "eraser",
        dpr,
      )
    }
  }, [tool, penWidth, dpr])

  // ─── Pointer event helpers ────────────────────────────────────────────────

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = drawCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    // Map screen touch coordinates to logical canvas size (900xH)
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
      // ── CASE 1: PAN MODE (Kéo cuộn bảng vẽ) ──────────────────────────────
      if (tool === "pan") {
        e.preventDefault()
        e.stopPropagation()
        isPanDraggingRef.current = true
        lastPanPosRef.current = { x: e.clientX, y: e.clientY }
        try {
          ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
        } catch {
          // Safe fallback
        }
        return
      }

      // ── CASE 2: PEN / ERASER DRAWING ──────────────────────────────────────
      // Palm rejection
      if (e.pointerType === "pen") {
        penDetectedRef.current = true
      } else if (penDetectedRef.current && e.pointerType === "touch") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

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
    [tool, canvasW, canvasH, redrawStrokes],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // ── CASE 1: PAN DRAGGING ──────────────────────────────────────────────
      if (tool === "pan" && isPanDraggingRef.current && lastPanPosRef.current) {
        e.preventDefault()
        e.stopPropagation()
        const dx = lastPanPosRef.current.x - e.clientX
        const dy = lastPanPosRef.current.y - e.clientY
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft += dx
          scrollContainerRef.current.scrollTop += dy
        }
        lastPanPosRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      // ── CASE 2: PEN / ERASER DRAWING ──────────────────────────────────────
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      if (!isDrawingRef.current) return

      e.preventDefault()
      e.stopPropagation()

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
    [tool, redrawStrokes, canvasW, canvasH],
  )

  const commitStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Release pan drag
      if (tool === "pan") {
        isPanDraggingRef.current = false
        lastPanPosRef.current = null
        try {
          if ((e.target as HTMLCanvasElement).hasPointerCapture(e.pointerId)) {
            ;(e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
          }
        } catch {
          // Safe fallback
        }
        return
      }

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
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // ─── Zoom Controls ────────────────────────────────────────────────────────

  function zoomIn() {
    setZoom((z) => Math.min(2.0, parseFloat((z + 0.15).toFixed(2))))
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.65, parseFloat((z - 0.15).toFixed(2))))
  }

  function resetZoom() {
    setZoom(1)
  }

  // ─── Export (Merge Grid + Drawing onto one Canvas in high resolution) ──────

  function handleExtract() {
    const gridCanvas = gridCanvasRef.current
    const drawCanvas = drawCanvasRef.current
    if (!gridCanvas || !drawCanvas || !hasStrokes) return

    const exportCanvas = document.createElement("canvas")
    exportCanvas.width = canvasW * 2
    exportCanvas.height = canvasH * 2
    const expCtx = exportCanvas.getContext("2d")
    if (!expCtx) return

    expCtx.imageSmoothingEnabled = true
    expCtx.imageSmoothingQuality = "high"

    expCtx.drawImage(gridCanvas, 0, 0, exportCanvas.width, exportCanvas.height)
    expCtx.drawImage(drawCanvas, 0, 0, exportCanvas.width, exportCanvas.height)

    const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.95)
    const base64 = dataUrl.split(",")[1] ?? ""
    onExtract(base64, "image/jpeg", dataUrl)
  }

  // ─── Width presets ────────────────────────────────────────────────────────
  const widths = [1.5, 2.5, 4]

  // ─── Render dimensions based on zoom ──────────────────────────────────────
  const displayW = Math.round(canvasW * zoom)
  const displayH = Math.round(canvasH * zoom)

  return (
    <div className="select-none space-y-3" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pen / Eraser / Pan toggle */}
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
          <button
            type="button"
            onClick={() => setTool("pan")}
            aria-pressed={tool === "pan"}
            title="Công cụ bàn tay để kéo di chuyển bảng vẽ"
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              tool === "pan"
                ? "bg-primary-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            <Hand className="h-3.5 w-3.5" />
            Di chuyển
          </button>
        </div>

        {/* Pen width (hide when pan mode) */}
        {tool !== "pan" && (
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
        )}

        {/* Zoom Controls */}
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
          <button
            type="button"
            onClick={zoomOut}
            title="Thu nhỏ bảng viết"
            className="flex h-7 w-7 items-center justify-center hover:bg-white active:bg-slate-100"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="px-2 text-[11px] font-semibold tracking-tighter text-slate-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            title="Phóng to bảng viết"
            className="flex h-7 w-7 items-center justify-center hover:bg-white active:bg-slate-100"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={resetZoom}
              title="Đặt lại kích thước 100%"
              className="border-l border-slate-200 px-1.5 py-1 text-[10px] text-slate-500 hover:bg-white"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
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

      {/* Canvas container with stacked layers & overflow scroll for zoomed view */}
      <div className="w-full">
        <div
          ref={scrollContainerRef}
          className="max-h-[75vh] overflow-x-auto overflow-y-auto rounded-xl border border-slate-300 bg-slate-100/60 p-2 shadow-inner"
          style={{
            width: "100%",
            WebkitOverflowScrolling: "touch",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Extra right padding for row markers */}
          <div
            className="relative mx-auto select-none rounded-lg bg-white shadow-sm"
            style={{
              width: displayW + 40,
              height: displayH,
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {/* Layer 1: Background Grid (Retina sharp bitmap) */}
            <canvas
              ref={gridCanvasRef}
              className="pointer-events-none absolute left-0 top-0 select-none rounded-lg"
              style={{
                width: displayW,
                height: displayH,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              aria-hidden="true"
            />

            {/* Layer 2: Drawing Ink Layer (Retina sharp bitmap) */}
            <canvas
              ref={drawCanvasRef}
              className="absolute left-0 top-0 select-none rounded-lg"
              style={{
                width: displayW,
                height: displayH,
                cursor:
                  tool === "pan" ? "grab" : tool === "eraser" ? "cell" : "crosshair",
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

      <p className="text-center text-[11px] text-slate-500">
        💡 <strong>Mẹo iPad:</strong> Bấm <strong>Bút</strong> để viết · Bấm <strong>Di chuyển ✋</strong> để kéo trượt bảng vẽ mượt mà khi phóng to
      </p>
    </div>
  )
}
