import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Post from "@/models/post"
import User from "@/models/user"
import Comment from "@/models/comment"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type") || "latest"

    await connectToDatabase()

    const skip = (page - 1) * limit

    const query = {}
    let posts = []

    if (type === "following") {
      const session = await auth()

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await User.findOne({ email: session.user.email })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      posts = await Post.find({ author: { $in: user.following } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name image username email")
        .lean()
    } else {
      posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name image username email")
        .lean()
    }

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
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, mediaUrls } = await request.json()

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return NextResponse.json({ error: "Post must contain text or media" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newPost = new Post({
      content,
      mediaUrls,
      author: user._id,
      createdAt: new Date(),
    })

    await newPost.save()

    return NextResponse.json({ message: "Post created successfully", post: newPost })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
