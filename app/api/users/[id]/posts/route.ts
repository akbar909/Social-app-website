import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Post from "@/models/post"
import User from "@/models/user"
import Comment from "@/models/comment"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    await connectToDatabase()

    const skip = (page - 1) * limit

    const posts = await Post.find({ author: params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name image username email")
      .lean()

    // Get like and comment counts and check if current user has liked each post
    const session = await auth()
    let currentUser = null

    if (session?.user) {
      currentUser = await User.findOne({ email: session.user.email })
    }

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id })
        const likeCount = post.likes.length

        // Check if current user has liked the post
        let isLiked = false
        if (currentUser) {
          isLiked = post.likes.some((like) => like.userId.toString() === currentUser._id.toString())
        }

        return {
          ...post,
          likeCount,
          commentCount,
          isLiked,
          _id: post._id.toString(),
          author: {
            ...post.author,
            _id: post.author._id.toString(),
          },
        }
      }),
    )

    return NextResponse.json({ posts: postsWithCounts })
  } catch (error) {
    console.error("Error fetching user posts:", error)
    return NextResponse.json({ error: "Failed to fetch user posts" }, { status: 500 })
  }
}
