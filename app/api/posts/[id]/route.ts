import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import Comment from "@/models/comment"
import Post from "@/models/post"
import User from "@/models/user"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const post = await Post.findById(params.id).populate("author", "name image username email").lean()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get like and comment counts
    const likeCount = post.likes.length
    const commentCount = await Comment.countDocuments({ postId: post._id })

    // Check if current user has liked the post
    let isLiked = false
    const session = await auth()

    if (session?.user) {
      const user = await User.findOne({ email: session.user.email })

      if (user) {
        isLiked = post.likes.some((like) => like.userId.toString() === user._id.toString())
      }
    }

    // Deeply convert all _id and createdAt fields to strings, including likes
    function serialize(obj: any) {
      if (Array.isArray(obj)) {
        return obj.map(serialize);
      } else if (obj && typeof obj === 'object' && obj !== null) {
        // Prevent serializing special objects like Date
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        const result: any = {};
        for (const key in obj) {
          if (key === '_id' && obj[key]?.toString) {
            result[key] = obj[key].toString();
          } else if (key === 'createdAt' && obj[key] instanceof Date) {
            result[key] = obj[key].toISOString();
          } else {
            result[key] = serialize(obj[key]);
          }
        }
        return result;
      }
      return obj;
    }

    const serializedPost = serialize(post);
    const serializedAuthor = serialize(post.author);
    const serializedLikes = post.likes ? serialize(post.likes) : [];

    return NextResponse.json({
      post: {
        ...serializedPost,
        likeCount,
        commentCount,
        isLiked,
        likes: serializedLikes,
        author: serializedAuthor,
      },
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ postId: params.id })

    // Delete the post
    await Post.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, mediaUrls } = await request.json()

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await Post.findById(params.id)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedPost = await Post.findByIdAndUpdate(params.id, { content, mediaUrls }, { new: true })

    return NextResponse.json({ message: "Post updated successfully", post: updatedPost })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}
