import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Story from "@/models/story"
import User from "@/models/user"
import { v2 as cloudinary } from "cloudinary"
import { NextRequest, NextResponse } from "next/server"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// GET: Get all active stories (not expired)
export async function GET() {
  try {
    await connectToDatabase()
    const now = new Date()
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .populate("user", "_id name image username")
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json({ stories })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 })
  }
}

// POST: Create a new story (text, image, or video)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    await connectToDatabase()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check content type for file upload
    const contentType = request.headers.get("content-type") || ""
    let storyData = { user: user._id, mediaType: "text" as "text" | "image" | "video", text: "", mediaUrl: undefined }

    if (contentType.includes("application/json")) {
      // Text story
      const { text } = await request.json()
      if (!text) {
        return NextResponse.json({ error: "Text is required for text story" }, { status: 400 })
      }
      storyData = { user: user._id, mediaType: "text", text }
    } else if (contentType.includes("multipart/form-data")) {
      // Image or video story
      const formData = await request.formData()
      const file = formData.get("file") as File
      const type = formData.get("mediaType") as string
      if (!file || !type || !["image", "video"].includes(type)) {
        return NextResponse.json({ error: "Invalid file or mediaType" }, { status: 400 })
      }
      // Upload to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64String = buffer.toString("base64")
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          `data:${file.type};base64,${base64String}`,
          {
            folder: "stories",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
      })
      storyData = {
        user: user._id,
        mediaType: type as "image" | "video",
        mediaUrl: (result as any).secure_url,
        text: formData.get("text") as string || "",
      }
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 })
    }

    // Save story
    const newStory = new Story(storyData)
    await newStory.save()
    return NextResponse.json({ message: "Story created", story: newStory })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
  }
}

// PUT: Update a story (only by owner)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    await connectToDatabase()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const { id, text } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Story id required" }, { status: 400 })
    }
    const story = await Story.findById(id)
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }
    if (story.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (typeof text === "string") story.text = text
    await story.save()
    return NextResponse.json({ message: "Story updated", story })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
  }
}

// DELETE: Delete a story (only by owner)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    await connectToDatabase()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Story id required" }, { status: 400 })
    }
    const story = await Story.findById(id)
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }
    if (story.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    await story.deleteOne()
    return NextResponse.json({ message: "Story deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 })
  }
}
