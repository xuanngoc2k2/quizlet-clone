"use client"

import { useRef, useState } from "react"
import { AlertCircle, Loader2, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import type { WritingQuestion54 } from "@/lib/writing-types"

type Props = { onSaved: (_id: string) => void }
type Extracted = Pick<
  WritingQuestion54,
  "examRef" | "instruction" | "imageAlt" | "rangeMin" | "rangeMax"
>

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => {
      const scale = Math.min(1, 1400 / image.width)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      const context = canvas.getContext("2d")
      if (!context) return reject(new Error("Canvas không khả dụng"))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Không thể nén ảnh"))),
        "image/jpeg",
        0.9,
      )
    }
    image.onerror = () => reject(new Error("Không thể đọc ảnh"))
    image.src = URL.createObjectURL(file)
  })
}

export function Writing54Importer({ onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [upload, setUpload] = useState<{ base64: string; mimeType: string } | null>(null)
  const [draft, setDraft] = useState<Extracted | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const extractMutation = api.writing54.extractFromImage.useMutation()
  const saveMutation = api.writing54.saveQuestion.useMutation()

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ JPG, PNG hoặc WebP")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const compressed = await compressImage(file)
      setPreview(URL.createObjectURL(compressed))
      const form = new FormData()
      form.append("file", compressed, "topik-54.jpg")
      const response = await fetch("/api/writing-upload", { method: "POST", body: form })
      if (!response.ok) throw new Error("Upload ảnh thất bại")
      const uploaded = (await response.json()) as { base64: string; mimeType: string }
      const extracted = await extractMutation.mutateAsync({
        imageBase64: uploaded.base64,
        imageMimeType: uploaded.mimeType,
      })
      setUpload(uploaded)
      setDraft(extracted)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "AI không thể đọc đề")
      setPreview(null)
      setDraft(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    if (!draft || !upload) return
    setBusy(true)
    setError(null)
    try {
      const result = await saveMutation.mutateAsync({
        examRef: draft.examRef ?? undefined,
        instruction: draft.instruction,
        imageAlt: draft.imageAlt ?? undefined,
        rangeMin: draft.rangeMin,
        rangeMax: draft.rangeMax,
        imageBase64: upload.base64,
        imageMimeType: upload.mimeType,
      })
      onSaved(result.id)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lưu đề thất bại")
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {!draft && (
        <div
          className="cursor-pointer rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-6 py-12 text-center hover:border-primary-400"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files[0]
            if (file) void handleFile(file)
          }}
          onPaste={(event) => {
            const file = Array.from(event.clipboardData.items)
              .find((item) => item.kind === "file" && item.type.startsWith("image/"))
              ?.getAsFile()
            if (!file) return
            event.preventDefault()
            void handleFile(file)
          }}
        >
          {busy ? (
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-500" />
          ) : (
            <Upload className="mx-auto mb-3 h-8 w-8 text-primary-500" />
          )}
          <p className="font-semibold text-primary-900">Upload hoặc kéo thả ảnh đề câu 54</p>
          <p className="mt-1 text-xs text-primary-500">
            Có thể dán ảnh bằng Cmd/Ctrl+V · AI sẽ đọc đề
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </div>
      )}

      {draft && preview && (
        <div className="space-y-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <img
              src={preview}
              alt="Preview đề câu 54"
              className="h-40 w-28 rounded-lg border border-slate-200 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary-600">
                <Sparkles className="h-4 w-4" /> AI đã trích xuất, hãy kiểm tra lại
              </div>
              <label className="block text-xs text-slate-500">
                Kỳ thi
                <input
                  value={draft.examRef ?? ""}
                  onChange={(event) => setDraft({ ...draft, examRef: event.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="mt-2 flex gap-2 text-xs text-slate-500">
                <label className="flex-1">
                  Min
                  <input
                    type="number"
                    value={draft.rangeMin}
                    onChange={(event) =>
                      setDraft({ ...draft, rangeMin: Number(event.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex-1">
                  Max
                  <input
                    type="number"
                    value={draft.rangeMax}
                    onChange={(event) =>
                      setDraft({ ...draft, rangeMax: Number(event.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>
          </div>
          <label className="block text-xs font-medium text-slate-600">
            Đề bài
            <textarea
              value={draft.instruction}
              onChange={(event) => setDraft({ ...draft, instruction: event.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Mô tả/gợi ý nội dung
            <textarea
              value={draft.imageAlt ?? ""}
              onChange={(event) => setDraft({ ...draft, imageAlt: event.target.value })}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDraft(null)
                setPreview(null)
                setUpload(null)
              }}
              disabled={busy}
            >
              Chọn ảnh khác
            </Button>
            <Button
              variant="gradient"
              className="flex-1"
              onClick={() => void handleSave()}
              loading={busy}
            >
              Lưu đề câu 54
            </Button>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
