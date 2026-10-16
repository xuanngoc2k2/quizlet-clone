"use client"

import { useRef, useState } from "react"
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  ScanText,
  Upload,
  PenLine,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { CanvasHandwriting } from "@/components/writing/CanvasHandwriting"
import { api } from "@/lib/trpc-provider"

type OcrResult = {
  text: string
  cells: string[]
  ocrConfidence: number
  spacingScore: number
  spacingFeedback: string
  spellingErrors: { original: string; corrected: string; explanation: string }[]
  layoutWarnings: string[]
}

type Props = {
  questionId: string
  onOcr: (_result: { text: string; cells: string[]; imageSrc: string }) => void
}

type InputMode = "upload" | "draw"

async function prepareImage(
  file: File,
): Promise<{ base64: string; mimeType: string; preview: string }> {
  const preview = URL.createObjectURL(file)
  const image = new Image()
  image.src = preview
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Không thể đọc ảnh"))
  })

  const scale = Math.min(1, 1600 / image.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Không thể nén ảnh"))),
      "image/jpeg",
      0.9,
    )
  })
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new Error("Không thể đọc dữ liệu ảnh"))
    reader.readAsDataURL(blob)
  })
  return { base64, mimeType: "image/jpeg", preview }
}

export function HandwrittenSubmission({ questionId, onOcr }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<InputMode>("upload")
  const [isPreparing, setIsPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocrDone, setOcrDone] = useState<OcrResult | null>(null)
  const ocrMutation = api.writing.ocrHandwritten53.useMutation()

  // ── Shared OCR call ─────────────────────────────────────────────────────────

  async function runOcr(base64: string, mimeType: string, previewSrc: string) {
    setError(null)
    setOcrDone(null)
    const result = await ocrMutation.mutateAsync({
      questionId,
      imageBase64: base64,
      imageMimeType: mimeType,
    })
    setOcrDone(result)
    onOcr({ text: result.text, cells: result.cells, imageSrc: previewSrc })
  }

  // ── Upload / paste flow ─────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError(null)
    setOcrDone(null)
    setIsPreparing(true)
    try {
      if (!file || !file.type.startsWith("image/")) return
      const prepared = await prepareImage(file)
      if (!prepared.base64) return
      await runOcr(prepared.base64, prepared.mimeType, prepared.preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể OCR ảnh")
    } finally {
      setIsPreparing(false)
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const image = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile()
    if (!image) return
    event.preventDefault()
    void handleFile(image)
  }

  // ── Canvas draw flow ────────────────────────────────────────────────────────

  async function handleCanvasExtract(base64: string, mimeType: string, previewDataUrl: string) {
    setError(null)
    try {
      await runOcr(base64, mimeType, previewDataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể OCR ảnh viết tay")
    }
  }

  const loading = isPreparing || ocrMutation.isLoading

  return (
    <section
      className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-4"
      onPaste={mode === "upload" ? handlePaste : undefined}
      tabIndex={0}
      aria-label="Khu vực nhập bài viết tay"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
          <ScanText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-emerald-950">Nhập bài viết tay</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
            Chọn cách nhập bài — AI sẽ OCR và điền tự động vào ô bên trên.
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="mb-4 inline-flex overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={[
            "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors",
            mode === "upload"
              ? "bg-emerald-600 text-white"
              : "text-emerald-700 hover:bg-emerald-50",
          ].join(" ")}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload / Chụp ảnh
        </button>
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={[
            "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors",
            mode === "draw"
              ? "bg-emerald-600 text-white"
              : "text-emerald-700 hover:bg-emerald-50",
          ].join(" ")}
        >
          <PenLine className="h-3.5 w-3.5" />
          ✏️ Viết trên màn hình
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <p className="mb-3 text-xs leading-relaxed text-emerald-800">
            Chụp rõ toàn bộ giấy 원고지 hoặc dán ảnh từ clipboard. AI sẽ OCR và điền
            tự động — bạn kiểm tra rồi mới nhấn <strong>Chấm bài</strong>.
          </p>

          {/* Success banner */}
          {ocrDone && !loading && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-semibold text-emerald-700">
                  OCR xong · Độ tin cậy {Math.round(ocrDone.ocrConfidence * 100)}%
                </p>
                <p className="text-emerald-600">
                  Hãy kiểm tra lại nội dung trong 원고지 rồi nhấn <strong>Chấm bài</strong>.
                </p>
                {ocrDone.spellingErrors.length > 0 && (
                  <p className="mt-0.5 text-amber-600">
                    Phát hiện {ocrDone.spellingErrors.length} lỗi chính tả có thể có — sẽ được
                    chấm cùng bài.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {loading ? "Đang OCR..." : ocrDone ? "Đọc lại ảnh" : "Chọn ảnh"}
            </Button>
            <Button
              type="button"
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
          <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700">
            <Upload className="h-3 w-3" /> Ảnh sẽ được lưu cùng lịch sử bài làm khi nộp.
          </p>
        </div>
      )}

      {/* Draw mode */}
      {mode === "draw" && (
        <div>
          <p className="mb-3 text-xs leading-relaxed text-emerald-800">
            Dùng Apple Pencil hoặc ngón tay để viết chữ vào ô 원고지 bên dưới.
            Mỗi ô = 1 ký tự. Nhấn <strong>Trích xuất chữ viết</strong> để AI đọc và điền vào
            ô trả lời — kiểm tra xong mới nhấn <strong>Chấm bài</strong>.
          </p>

          {/* Success banner */}
          {ocrDone && !loading && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div>
                <p className="font-semibold text-emerald-700">
                  OCR xong · Độ tin cậy {Math.round(ocrDone.ocrConfidence * 100)}%
                </p>
                <p className="text-emerald-600">
                  Kiểm tra lại 원고지 bên trên rồi nhấn <strong>Chấm bài</strong>.
                </p>
              </div>
            </div>
          )}

          {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}

          <CanvasHandwriting
            onExtract={(base64, mimeType, previewDataUrl) =>
              void handleCanvasExtract(base64, mimeType, previewDataUrl)
            }
            isLoading={loading}
            extractLabel={loading ? "Đang OCR..." : "Trích xuất chữ viết"}
          />
        </div>
      )}
    </section>
  )
}
