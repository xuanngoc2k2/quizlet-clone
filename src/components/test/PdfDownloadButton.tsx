"use client"

import React, { useState } from "react"
import { type TestData } from "./TopikPdfDocument"
import { Download, Loader2 } from "lucide-react"

export default function PdfDownloadButton({ testData }: { testData: TestData }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    
    try {
      // Import động để tránh lỗi SSR
      const { pdf } = await import("@react-pdf/renderer")
      const { TopikPdfDocument } = await import("./TopikPdfDocument")
      
      const blob = await pdf(<TopikPdfDocument testData={testData} />).toBlob()
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = url
      link.download = `${testData.title || "Topik_Test"}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Lỗi khi tạo PDF:", error)
      alert("Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại sau.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-70"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tạo PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Tải PDF
        </>
      )}
    </button>
  )
}
