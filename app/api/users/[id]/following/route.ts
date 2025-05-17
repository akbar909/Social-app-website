import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/user"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    await connectToDatabase()

    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const skip = (page - 1) * limit

    const following = await User.find({ _id: { $in: user.following } })
      .select("name username image")
      .skip(skip)
      .limit(limit)
      .lean()

    const formattedFollowing = following.map((follow) => ({
      ...follow,
      _id: follow._id.toString(),
    }))

    return NextResponse.json({ following: formattedFollowing })
  } catch (error) {
    console.error("Error fetching following:", error)
    return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 })
  }
}
