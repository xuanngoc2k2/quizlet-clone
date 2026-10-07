"use client"

import { useRef, useState } from "react"
import { Camera, ImagePlus, Loader2, ScanText } from "lucide-react"
import { Button } from "@/components/ui/Button"
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
}

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

export function HandwrittenSubmission54({ questionId, onGraded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mutation = api.writing54.gradeHandwritten54.useMutation()

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return setError("Chỉ hỗ trợ file ảnh")
    setBusy(true)
    setError(null)
    try {
      const prepared = await prepareImage(file)
      const result = await mutation.mutateAsync({
        questionId,
        imageBase64: prepared.base64,
        imageMimeType: prepared.mimeType,
      })
      onGraded({
        grade: result.grade as WritingGrade54,
        answer: result.answer,
        cells: result.cells,
        imageSrc: prepared.preview,
      })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Không thể OCR và chấm ảnh",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/70 p-4"
      onPaste={(event) => {
        const file = Array.from(event.clipboardData.items)
          .find((item) => item.kind === "file" && item.type.startsWith("image/"))
          ?.getAsFile()
        if (file) {
          event.preventDefault()
          void handleFile(file)
        }
      }}
      tabIndex={0}
      aria-label="Khu vực dán ảnh bài viết tay"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-100 p-2 text-orange-700">
          <ScanText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-orange-950">Upload ảnh bài viết tay</h2>
          <p className="mt-1 text-xs leading-relaxed text-orange-800">
            Chụp rõ toàn bộ trang 원고지 600~700 ký tự hoặc dán ảnh từ clipboard. AI sẽ đọc OCR,
            kiểm tra ô và chấm theo barem câu 54.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {busy ? "Đang OCR và chấm..." : "Chọn ảnh"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
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
      </div>
    </section>
  )
}
