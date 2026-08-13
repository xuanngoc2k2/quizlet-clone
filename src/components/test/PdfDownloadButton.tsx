"use client"

import React, { useEffect, useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { TopikPdfDocument, type TestData } from "./TopikPdfDocument"
import { Download } from "lucide-react"

export default function PdfDownloadButton({ testData }: { testData: TestData }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-sm font-medium text-primary-400 opacity-50">
        <Download className="h-4 w-4" />
        Chuẩn bị PDF...
      </div>
    )
  }

  return (
    <PDFDownloadLink
      document={<TopikPdfDocument testData={testData} />}
      fileName={`${testData.title || "Topik_Test"}.pdf`}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
    >
      {({ loading }) => (
        <>
          <Download className="h-4 w-4" />
          {loading ? "Đang tạo PDF..." : "Tải PDF"}
        </>
      )}
    </PDFDownloadLink>
  )
}
