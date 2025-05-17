import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/user"
import Post from "@/models/post"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await User.findById(params.id).select("-password").lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: user._id })

    // Get follower and following counts
    const followerCount = user.followers.length
    const followingCount = user.following.length

    // Check if current user is following this user
    let isFollowing = false
    const session = await auth()

    if (session?.user) {
      const currentUser = await User.findOne({ email: session.user.email })

      if (currentUser) {
        isFollowing = currentUser.following.some((id) => id.toString() === user._id.toString())
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        _id: user._id.toString(),
        followers: followerCount,
        following: followingCount,
        postCount,
        isFollowing,
      },
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const currentUser = await User.findOne({ email: session.user.email })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentUser._id.toString() !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, username, bio, image } = await request.json()

    // Check if username is already taken by another user
    if (username !== currentUser.username) {
      const existingUser = await User.findOne({ username })
      if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(params.id, { name, username, bio, image }, { new: true }).select(
      "-password",
    )

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
