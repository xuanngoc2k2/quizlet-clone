"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, Loader2, Save, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import { validateWritingQuestion51Content } from "@/lib/writing-question-51"
import type { WritingBlank51, WritingPassageSegment51 } from "@/lib/writing-types"

type Props = { onSaved: (_id: string) => void }

type ExtractedQuestion51 = {
  questionNumber: number
  title: string
  instruction: string
  passage: WritingPassageSegment51[]
  blanks: WritingBlank51[]
  score: 10
  source?: string
}

type UploadState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "extracting"; previewSrc: string }
  | { step: "review"; previewSrc: string }
  | { step: "saving"; previewSrc: string }

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"

async function compressImage(file: File, maxWidthPx = 1400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => {
      const scale = Math.min(1, maxWidthPx / image.width)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      const context = canvas.getContext("2d")
      if (!context) { reject(new Error("Canvas không khả dụng")); return }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Không thể nén ảnh")), "image/jpeg", 0.9)
    }
    image.onerror = () => reject(new Error("Không thể đọc ảnh"))
    image.src = URL.createObjectURL(file)
  })
}

export function WritingQuestion51Importer({ onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ step: "idle" })
  const [draft, setDraft] = useState<ExtractedQuestion51 | null>(null)
  const [error, setError] = useState<string | null>(null)
  const extractMutation = api.writing51.extractFromImage.useMutation()
  const saveMutation = api.writing51.saveQuestion.useMutation()

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Chỉ hỗ trợ JPG, PNG hoặc WebP"); return }
    setError(null)
    setUploadState({ step: "uploading" })
    try {
      const compressed = await compressImage(file)
      const previewSrc = URL.createObjectURL(compressed)
      const form = new FormData()
      form.append("file", compressed, "topik-51.jpg")
      const response = await fetch("/api/writing-upload", { method: "POST", body: form })
      if (!response.ok) throw new Error(((await response.json()) as { error?: string }).error ?? "Upload thất bại")
      const uploaded = await response.json() as { base64: string; mimeType: string }
      setUploadState({ step: "extracting", previewSrc })
      const extracted = await extractMutation.mutateAsync({
        imageBase64: uploaded.base64,
        imageMimeType: uploaded.mimeType,
      })
      setDraft(extracted as ExtractedQuestion51)
      setUploadState({ step: "review", previewSrc })
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI không thể phân tích đề")
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
      void handleFile(image)
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [handleFile, uploadState.step])

  function updateDraft(patch: Partial<ExtractedQuestion51>) {
    setDraft((current) => current ? { ...current, ...patch } : current)
  }

  function updatePassage(index: number, content: string) {
    if (!draft) return
    updateDraft({ passage: draft.passage.map((segment, segmentIndex) => segmentIndex === index && segment.type === "text" ? { ...segment, content } : segment) })
  }

  function updateBlank(id: string, field: "answer" | "explanation", value: string) {
    if (!draft) return
    updateDraft({ blanks: draft.blanks.map((blank) => blank.id === id ? { ...blank, [field]: field === "answer" ? value.split("\n") : value } : blank) })
  }

  async function save() {
    if (!draft) return
    const errors = validateWritingQuestion51Content(draft)
    if (errors.length) { setError(errors.join("; ")); return }
    setError(null)
    setUploadState((current) => current.step === "review" ? { step: "saving", previewSrc: current.previewSrc } : current)
    try {
      const result = await saveMutation.mutateAsync(draft)
      onSaved(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu đề thất bại")
      setUploadState((current) => current.step === "saving" ? { step: "review", previewSrc: current.previewSrc } : current)
    }
  }

  const isBusy = uploadState.step === "uploading" || uploadState.step === "extracting" || uploadState.step === "saving"

  return (
    <div className="space-y-5">
      {uploadState.step === "idle" && (
        <div className="cursor-pointer rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-6 py-12 text-center transition-colors hover:border-primary-400 hover:bg-primary-100" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onPaste={(event) => { const image = Array.from(event.clipboardData.items).find((item) => item.kind === "file" && item.type.startsWith("image/"))?.getAsFile() ?? event.clipboardData.files[0]; if (!image) return; event.preventDefault(); void handleFile(image) }} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void handleFile(file) }}>
          <Upload className="mx-auto mb-3 h-8 w-8 text-primary-500" />
          <p className="font-semibold text-primary-900">Upload hoặc dán ảnh đề câu 51</p>
          <p className="mt-1 text-xs text-primary-500">Cmd/Ctrl+V · AI sẽ đọc passage, blank và đáp án để bạn kiểm tra</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file) }} />
        </div>
      )}

      {isBusy && <div className="flex flex-col items-center rounded-2xl border border-primary-100 bg-white py-12"><Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-500" /><p className="text-sm font-medium text-primary-700">{uploadState.step === "uploading" ? "Đang tải ảnh..." : uploadState.step === "extracting" ? "AI đang phân tích đề..." : "Đang lưu đề..."}</p></div>}

      {draft && (uploadState.step === "review" || uploadState.step === "saving") && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-800"><Sparkles className="h-4 w-4 shrink-0" />AI đã trích xuất. Kiểm tra lại nội dung trước khi lưu.</div>
          <label className="block text-xs font-semibold text-slate-600">Tiêu đề<input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-600">Hướng dẫn<textarea value={draft.instruction} onChange={(event) => updateDraft({ instruction: event.target.value })} rows={3} className={fieldClass} /></label>
          <div className="max-w-xs rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">10 điểm · mỗi blank tối đa 5 điểm</div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h2 className="mb-3 font-semibold text-slate-800">Passage đã phân tích</h2><div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">{draft.passage.map((segment, index) => segment.type === "text" ? <textarea key={`text-${index}`} value={segment.content} onChange={(event) => updatePassage(index, event.target.value)} rows={2} className={fieldClass} /> : <div key={segment.id} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">({segment.label})</div>)}</div></section>

          <section className="space-y-3"><h2 className="font-semibold text-slate-800">Đáp án chuẩn</h2>{draft.blanks.map((blank) => <div key={blank.id} className="rounded-xl border border-slate-200 bg-white p-4"><p className="font-semibold text-primary-700">Blank ({blank.label})</p><label className="mt-2 block text-xs text-slate-500">Accepted answers, mỗi đáp án một dòng<textarea value={blank.answer.join("\n")} onChange={(event) => updateBlank(blank.id, "answer", event.target.value)} rows={3} className={fieldClass} /></label><label className="mt-2 block text-xs text-slate-500">Giải thích<textarea value={blank.explanation ?? ""} onChange={(event) => updateBlank(blank.id, "explanation", event.target.value)} rows={2} className={fieldClass} /></label></div>)}</section>
          {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => { setDraft(null); setError(null); setUploadState({ step: "idle" }) }} disabled={isBusy}>Chọn ảnh khác</Button><Button type="button" variant="gradient" onClick={() => void save()} loading={saveMutation.isLoading}><Save className="h-5 w-5" />Lưu đề câu 51</Button></div>
        </div>
      )}
      {error && uploadState.step === "idle" && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
}