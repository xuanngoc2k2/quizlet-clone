"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, ScanText, Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import type { WritingGrade } from "@/lib/writing-types"

type Props = {
  questionId: string
  onGraded: (result: {
    grade: WritingGrade
    answer: string
    cells: string[]
    imageSrc: string
  }) => void
}

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

export function HandwrittenSubmission({ questionId, onGraded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gradeMutation = api.writing.gradeHandwritten53.useMutation()

  async function handleFile(file: File) {
    setError(null)
    setIsPreparing(true)
    try {
      if (!file || !file.type.startsWith("image/")) return
      const prepared = await prepareImage(file)
      if (!prepared.base64) return
      const result = await gradeMutation.mutateAsync({
        questionId,
        imageBase64: prepared.base64,
        imageMimeType: prepared.mimeType,
      })
      onGraded({
        grade: result.grade as WritingGrade,
        answer: result.answer,
        cells: result.cells,
        imageSrc: prepared.preview,
      })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Không thể chấm ảnh")
    } finally {
      setIsPreparing(false)
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const image = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile()

    // Do not trigger OCR for pasted text, an empty clipboard, or unsupported data.
    if (!image) return
    event.preventDefault()
    void handleFile(image)
  }

  const loading = isPreparing || gradeMutation.isLoading
  return (
    <section
      className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-4"
      onPaste={handlePaste}
      tabIndex={0}
      aria-label="Khu vực dán ảnh bài viết tay"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
          <ScanText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-emerald-950">Chấm bài viết tay bằng ảnh</h2>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800">
            Chụp rõ toàn bộ giấy 원고지 hoặc dán ảnh từ clipboard. AI sẽ OCR, kiểm tra chính tả,
            khoảng cách ô và chấm như bài gõ máy.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
              {loading ? "Đang OCR và chấm..." : "Chọn ảnh"}
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
            <Upload className="h-3 w-3" /> Ảnh được lưu cùng lịch sử bài làm để xem lại.
          </p>
        </div>
      </div>
    </section>
  )
}
