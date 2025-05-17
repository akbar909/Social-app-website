import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Comment from "@/models/comment"
import Post from "@/models/post"
import User from "@/models/user"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context
  const awaitedParams = await params

  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    await connectToDatabase()

    const skip = (page - 1) * limit

    const comments = await Comment.find({ postId: awaitedParams.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name image username email")
      .lean()

    const formattedComments = comments.map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
      author: {
        ...comment.author,
        _id: comment.author._id.toString(),
      },
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await Post.findById(params.id)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const newComment = new Comment({
      content,
      author: user._id,
      postId: params.id,
      createdAt: new Date(),
    })

    await newComment.save()

    const populatedComment = await Comment.findById(newComment._id)
      .populate("author", "name image username email")
      .lean()

    return NextResponse.json({
      message: "Comment added successfully",
      comment: {
        ...populatedComment,
        _id: populatedComment._id.toString(),
        author: {
          ...populatedComment.author,
          _id: populatedComment.author._id.toString(),
        },
      },
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
