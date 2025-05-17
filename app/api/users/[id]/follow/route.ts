import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/user"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const userToFollow = await User.findById(params.id)

    if (!userToFollow) {
      return NextResponse.json({ error: "User to follow not found" }, { status: 404 })
    }

    if (currentUser._id.toString() === userToFollow._id.toString()) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const alreadyFollowing = currentUser.following.some((id) => id.toString() === userToFollow._id.toString())

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((id) => id.toString() !== userToFollow._id.toString())
      userToFollow.followers = userToFollow.followers.filter((id) => id.toString() !== currentUser._id.toString())
    } else {
      // Follow
      currentUser.following.push(userToFollow._id)
      userToFollow.followers.push(currentUser._id)
    }

    await currentUser.save()
    await userToFollow.save()

    return NextResponse.json({
      message: alreadyFollowing ? "User unfollowed successfully" : "User followed successfully",
      following: !alreadyFollowing,
    })
  } catch (error) {
    console.error("Error following/unfollowing user:", error)
    return NextResponse.json({ error: "Failed to follow/unfollow user" }, { status: 500 })
  }
}
