import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/user"
import Post from "@/models/post"
import Comment from "@/models/comment"
import { auth } from "@/lib/auth"

export async function getUserById(id: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(id).select("-password").lean()

    if (!user) {
      return null
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: user._id })

    // Ensure followers and following are arrays of strings
    const followerIds = (user.followers || []).map((id: any) => id.toString())
    const followingIds = (user.following || []).map((id: any) => id.toString())

    const followerCount = followerIds.length
    const followingCount = followingIds.length

    // Check if current user is following this user
    let isFollowing = false
    const session = await auth()

    if (session?.user) {
      const currentUser = await User.findOne({ email: session.user.email }).lean()

      if (currentUser?.following) {
        isFollowing = currentUser.following
          .map((id: any) => id.toString())
          .includes(user._id.toString())
      }
    }

    return {
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString?.(),
      updatedAt: user.updatedAt?.toISOString?.(),
      followers: followerCount,
      following: followingCount,
      postCount,
      isFollowing,
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getUserByEmail(email: string) {
  try {
    await connectToDatabase()

    const user = await User.findOne({ email }).select("-password").lean()

    if (!user) {
      return null
    }

    return {
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString?.(),
      updatedAt: user.updatedAt?.toISOString?.(),
      followers: (user.followers || []).map((id: any) => id.toString()),
      following: (user.following || []).map((id: any) => id.toString()),
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getPostById(id: string) {
  try {
    await connectToDatabase()

    const post = await Post.findById(id)
      .populate("author", "name image username email")
      .lean()

    if (!post) {
      return null
    }

    // Get like and comment counts
    const likeCount = post.likes?.length || 0
    const commentCount = await Comment.countDocuments({ postId: post._id })

    // Check if current user has liked the post
    let isLiked = false
    const session = await auth()

    if (session?.user) {
      const user = await User.findOne({ email: session.user.email }).lean()

      if (user) {
        const userId = user._id.toString()
        isLiked = post.likes?.some((like: any) => like.userId?.toString() === userId)
      }
    }

    return {
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt?.toISOString?.(),
      updatedAt: post.updatedAt?.toISOString?.(),
      likeCount,
      commentCount,
      isLiked,
      author: {
        ...post.author,
        _id: post.author._id.toString(),
      },
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}
