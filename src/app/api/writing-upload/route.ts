import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"

/**
 * POST /api/writing-upload
 * Accepts a multipart/form-data with field "file" (image).
 * Compresses (client should pre-compress) then returns raw base64 + mimeType.
 * Does NOT store anything — just converts for Gemini Vision.
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or WebP images are supported" },
        { status: 400 },
      )
    }

    // 8MB limit (after client-side compression, actual image should be < 4MB)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    return NextResponse.json({
      base64,
      mimeType: file.type,
      sizeKB: Math.round(file.size / 1024),
    })
  } catch (error) {
    // eslint-disable-next-line
    console.error("Writing upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
