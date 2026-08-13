import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const text = searchParams.get("text")
    const lang = searchParams.get("lang") || "ko"

    if (!text) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 })
    }

    // 1. Kiểm tra cache trong DB (wrap trong try-catch để fallback nếu DB lỗi)
    try {
      const cached = await prisma.ttsCache.findUnique({
        where: {
          text_lang: {
            text,
            lang,
          },
        },
      })

      if (cached) {
        const buffer = Buffer.from(cached.audioBase64, "base64")
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }
    } catch (dbError) {
      console.warn("Failed to read TTS cache, falling back to API:", dbError)
    }

    // 2. Nếu chưa có, gọi Google Translate TTS API
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`
    
    const response = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
      }
    })

    if (!response.ok) {
      throw new Error(`Google TTS returned status ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // 3. Lưu vào database cache
    try {
      await prisma.ttsCache.create({
        data: {
          text,
          lang,
          audioBase64: base64,
        },
      })
    } catch (e) {
      console.warn("Failed to save TTS cache (might already exist):", e)
    }

    // 4. Trả về âm thanh cho client
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("TTS Route Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
