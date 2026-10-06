"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Upload, ImageIcon, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import type { ExtractedQuestion } from "@/lib/writing-types"

type Props = {
  onSaved: (id: string) => void
}

type UploadState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "extracting"; previewSrc: string; base64: string; mimeType: string }
  | { step: "review"; previewSrc: string; base64: string; mimeType: string; extracted: ExtractedQuestion }
  | { step: "saving"; previewSrc: string }

/** Compress image on client using Canvas before upload */
async function compressImage(file: File, maxWidthPx = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidthPx / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas not supported")); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Compression failed")),
        "image/jpeg",
        0.88,
      )
    }
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = URL.createObjectURL(file)
  })
}

export function QuestionImporter({ onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ step: "idle" })
  const [error, setError] = useState<string | null>(null)

  // Form fields for review step
  const [fields, setFields] = useState({
    examRef: "",
    instruction: "",
    imageAlt: "",
    rangeMin: "200",
    rangeMax: "300",
  })

  const extractMutation = api.writing.extractFromImage.useMutation()
  const saveMutation = api.writing.saveQuestion.useMutation()

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ file ảnh (JPG, PNG, WebP)")
      return
    }
    setError(null)
    setUploadState({ step: "uploading" })

    try {
      // Compress on client
      const compressed = await compressImage(file)
      const previewSrc = URL.createObjectURL(compressed)

      // Upload to server → get base64
      const form = new FormData()
      form.append("file", compressed, "exam.jpg")
      const res = await fetch("/api/writing-upload", { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? "Upload failed")
      }
      const { base64, mimeType } = await res.json() as { base64: string; mimeType: string }

      setUploadState({ step: "extracting", previewSrc, base64, mimeType })

      // AI extract
      const extracted = await extractMutation.mutateAsync({ imageBase64: base64, imageMimeType: mimeType })

      setFields({
        examRef: extracted.examRef ?? "",
        instruction: extracted.instruction,
        imageAlt: extracted.imageAlt,
        rangeMin: String(extracted.rangeMin),
        rangeMax: String(extracted.rangeMax),
      })
      setUploadState({ step: "review", previewSrc, base64, mimeType, extracted })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      setUploadState({ step: "idle" })
    }
  }, [extractMutation])

  useEffect(() => {
    if (uploadState.step !== "idle") return

    function handlePaste(event: ClipboardEvent) {
      const image = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile()
        ?? event.clipboardData?.files[0]

      if (!image) return
      event.preventDefault()
      void handleFileSelect(image)
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [handleFileSelect, uploadState.step])

  async function handleSave() {
    if (uploadState.step !== "review") return
    setError(null)
    setUploadState({ step: "saving", previewSrc: uploadState.previewSrc })

    try {
      const { base64, mimeType } = uploadState
      const result = await saveMutation.mutateAsync({
        examRef: fields.examRef || undefined,
        instruction: fields.instruction,
        imageBase64: base64,
        imageMimeType: mimeType,
        imageAlt: fields.imageAlt || undefined,
        rangeMin: parseInt(fields.rangeMin) || 200,
        rangeMax: parseInt(fields.rangeMax) || 300,
      })
      onSaved(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại")
      setUploadState((prev) =>
        prev.step === "saving"
          ? { step: "review", previewSrc: prev.previewSrc, base64: "", mimeType: "", extracted: fields as unknown as ExtractedQuestion }
          : prev
      )
    }
  }

  const isLoading =
    uploadState.step === "uploading" || uploadState.step === "extracting" || uploadState.step === "saving"

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      {uploadState.step === "idle" && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-6 py-10 text-center transition-colors hover:border-primary-400 hover:bg-primary-100 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onPaste={(e) => {
            const image = Array.from(e.clipboardData.items)
              .find((item) => item.kind === "file" && item.type.startsWith("image/"))
              ?.getAsFile()
              ?? e.clipboardData.files[0]
            if (!image) return
            e.preventDefault()
            void handleFileSelect(image)
          }}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFileSelect(file)
          }}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Upload className="h-7 w-7 text-primary-500" />
          </div>
          <p className="font-semibold text-primary-900">Kéo thả, nhấn để chọn hoặc dán ảnh đề</p>
          <p className="mt-1 text-xs text-primary-400">JPG, PNG, WebP · Ctrl+V · Tối đa 8MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
          />
        </div>
      )}

      {/* Loading states */}
      {(uploadState.step === "uploading" || uploadState.step === "extracting") && (
        <div className="flex flex-col items-center rounded-2xl border border-primary-100 bg-white py-10">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-400" />
          <p className="text-sm font-medium text-primary-700">
            {uploadState.step === "uploading" ? "Đang tải ảnh..." : "AI đang đọc đề..."}
          </p>
          {uploadState.step === "extracting" && (
            <p className="mt-1 text-xs text-primary-400">Gemini Vision đang phân tích đề bài</p>
          )}
        </div>
      )}

      {/* Review extracted data + image preview */}
      {(uploadState.step === "review" || uploadState.step === "saving") && (
        <>
          <div className="flex gap-3 items-start">
            <div className="shrink-0">
              {/* Preview */}
              <div className="w-32 overflow-hidden rounded-xl border border-primary-100">
                {/* eslint-disable-next-line */}
                <img
                  src={uploadState.previewSrc}
                  alt="Preview"
                  className="w-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <p className="text-xs font-semibold text-primary-600">
                  AI đã trích xuất — hãy kiểm tra và chỉnh sửa nếu cần
                </p>
              </div>
              <div className="space-y-1">
                <label className="block">
                  <span className="text-[11px] font-medium text-primary-400">Kỳ thi</span>
                  <input
                    value={fields.examRef}
                    onChange={(e) => setFields((f) => ({ ...f, examRef: e.target.value }))}
                    placeholder="Ví dụ: TOPIK 83회 53번"
                    className="mt-0.5 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                  />
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 block">
                    <span className="text-[11px] font-medium text-primary-400">Min (자)</span>
                    <input
                      type="number"
                      value={fields.rangeMin}
                      onChange={(e) => setFields((f) => ({ ...f, rangeMin: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </label>
                  <label className="flex-1 block">
                    <span className="text-[11px] font-medium text-primary-400">Max (자)</span>
                    <input
                      type="number"
                      value={fields.rangeMax}
                      onChange={(e) => setFields((f) => ({ ...f, rangeMax: e.target.value }))}
                      className="mt-0.5 w-full rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-primary-600">
              Đề bài (tiếng Hàn) <span className="text-red-500">*</span>
            </span>
            <textarea
              value={fields.instruction}
              onChange={(e) => setFields((f) => ({ ...f, instruction: e.target.value }))}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Nhập nội dung đề bài tiếng Hàn..."
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-primary-600">
              Mô tả biểu đồ/dữ liệu
              <span className="ml-1 text-[10px] text-primary-400">(AI dùng để chấm bài chính xác hơn)</span>
            </span>
            <textarea
              value={fields.imageAlt}
              onChange={(e) => setFields((f) => ({ ...f, imageAlt: e.target.value }))}
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              placeholder="Mô tả chi tiết biểu đồ và số liệu..."
            />
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => { setUploadState({ step: "idle" }); setFields({ examRef: "", instruction: "", imageAlt: "", rangeMin: "200", rangeMax: "300" }) }}
              className="flex-1 rounded-xl border border-primary-200 py-2.5 text-sm font-medium text-primary-600 hover:border-primary-300 hover:text-primary-700"
              disabled={uploadState.step === "saving"}
            >
              Chọn ảnh khác
            </button>
            <Button
              onClick={handleSave}
              variant="gradient"
              className="flex-1"
              loading={uploadState.step === "saving"}
              disabled={!fields.instruction.trim()}
            >
              Lưu đề
            </Button>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
