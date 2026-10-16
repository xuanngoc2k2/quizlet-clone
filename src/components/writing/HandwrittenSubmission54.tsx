"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, PenLine, ScanText, Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { CanvasHandwriting } from "@/components/writing/CanvasHandwriting"
import { api } from "@/lib/trpc-provider"
import type { WritingGrade54 } from "@/lib/writing-types"

type Props = {
  questionId: string
  onGraded: (_result: {
    grade: WritingGrade54
    answer: string
    cells: string[]
    imageSrc: string
  }) => void
  mode?: InputMode
  onModeChange?: (_mode: InputMode) => void
}

type InputMode = "upload" | "draw"

async function prepareImage(file: File) {
  const preview = URL.createObjectURL(file)
  const image = new Image()
  image.src = preview
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Không thể đọc ảnh"))
  })
  const scale = Math.min(1, 1800 / image.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas không khả dụng")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Không thể nén ảnh"))),
      "image/jpeg",
      0.9,
    ),
  )
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new Error("Không thể đọc dữ liệu ảnh"))
    reader.readAsDataURL(blob)
  })
  return { base64, mimeType: "image/jpeg", preview }
}

export function HandwrittenSubmission54({
  questionId,
  onGraded,
  mode: controlledMode,
  onModeChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalMode, setInternalMode] = useState<InputMode>("upload")
  const mode = controlledMode ?? internalMode
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mutation = api.writing54.gradeHandwritten54.useMutation()

  function handleModeChange(newMode: InputMode) {
    setInternalMode(newMode)
    onModeChange?.(newMode)
  }

  // ── Shared grading call ─────────────────────────────────────────────────────

  async function runGrade(base64: string, mimeType: string, previewSrc: string) {
    const result = await mutation.mutateAsync({
      questionId,
      imageBase64: base64,
      imageMimeType: mimeType,
    })
    onGraded({
      grade: result.grade as WritingGrade54,
      answer: result.answer,
      cells: result.cells,
      imageSrc: previewSrc,
    })
  }

  // ── Upload flow ─────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return setError("Chỉ hỗ trợ file ảnh")
    setBusy(true)
    setError(null)
    try {
      const prepared = await prepareImage(file)
      await runGrade(prepared.base64, prepared.mimeType, prepared.preview)
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Không thể OCR và chấm ảnh",
      )
    } finally {
      setBusy(false)
    }
  }

  // ── Canvas draw flow ────────────────────────────────────────────────────────

  async function handleCanvasExtract(base64: string, mimeType: string, previewDataUrl: string) {
    setBusy(true)
    setError(null)
    try {
      await runGrade(base64, mimeType, previewDataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể OCR và chấm bài viết tay")
    } finally {
      setBusy(false)
    }
  }

  const loading = busy || mutation.isLoading

  return (
    <section
      className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/70 p-4"
      onPaste={
        mode === "upload"
          ? (event) => {
              const file = Array.from(event.clipboardData.items)
                .find((item) => item.kind === "file" && item.type.startsWith("image/"))
                ?.getAsFile()
              if (file) {
                event.preventDefault()
                void handleFile(file)
              }
            }
          : undefined
      }
      tabIndex={0}
      aria-label="Khu vực nhập bài viết tay câu 54"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-xl bg-orange-100 p-2 text-orange-700">
          <ScanText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-orange-950">Nhập bài viết tay</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-orange-800">
            Chọn cách nhập bài — AI sẽ OCR, kiểm tra ô và chấm theo barem câu 54.
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="mb-4 inline-flex overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => handleModeChange("upload")}
          className={[
            "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors",
            mode === "upload"
              ? "bg-orange-500 text-white"
              : "text-orange-700 hover:bg-orange-50",
          ].join(" ")}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload / Chụp ảnh
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("draw")}
          className={[
            "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors",
            mode === "draw"
              ? "bg-orange-500 text-white"
              : "text-orange-700 hover:bg-orange-50",
          ].join(" ")}
        >
          <PenLine className="h-3.5 w-3.5" />
          ✏️ Viết trên màn hình
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <p className="mb-3 text-xs leading-relaxed text-orange-800">
            Chụp rõ toàn bộ trang 원고지 600~700 ký tự hoặc dán ảnh từ clipboard. AI sẽ đọc
            OCR, kiểm tra ô và chấm theo barem câu 54.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {loading ? "Đang OCR và chấm..." : "Chọn ảnh"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              <Camera className="h-4 w-4" />
              Chụp ảnh
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
                event.target.value = ""
              }}
            />
          </div>
          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
        </div>
      )}

      {/* Draw mode */}
      {mode === "draw" && (
        <div>
          <p className="mb-3 text-xs leading-relaxed text-orange-800">
            Dùng Apple Pencil hoặc ngón tay để viết vào ô 원고지 bên dưới (600~700 ký tự). Mỗi
            ô = 1 ký tự. Nhấn <strong>Trích xuất &amp; Chấm bài</strong> — AI sẽ OCR và chấm
            ngay theo barem câu 54.
          </p>

          {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}

          <CanvasHandwriting
            maxCells={700}
            onExtract={(base64, mimeType, previewDataUrl) =>
              void handleCanvasExtract(base64, mimeType, previewDataUrl)
            }
            isLoading={loading}
            extractLabel={loading ? "Đang OCR và chấm..." : "Trích xuất & Chấm bài"}
          />
        </div>
      )}
    </section>
  )
}
