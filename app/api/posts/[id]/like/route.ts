import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Post from "@/models/post"
import User from "@/models/user"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const post = await Post.findById(params.id)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.some((like) => like.userId.toString() === user._id.toString())

    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter((like) => like.userId.toString() !== user._id.toString())
    } else {
      // Like the post
      post.likes.push({
        userId: user._id,
        createdAt: new Date(),
      })
    }

    await post.save()

    return NextResponse.json({
      message: alreadyLiked ? "Post unliked successfully" : "Post liked successfully",
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    })
  } catch (error) {
    console.error("Error liking/unliking post:", error)
    return NextResponse.json({ error: "Failed to like/unlike post" }, { status: 500 })
  }
}
