import { ProfileHeader } from "@/components/profile-header"
import { ProfileTabs } from "@/components/profile-tabs"
import { auth } from "@/lib/auth"
import { getUserById } from "@/lib/data"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const user = await getUserById(params.id)

  if (!user) {
    notFound()
  }

  const isCurrentUser = session?.user?.email === user.email

  return (
    <div className="container mx-auto  max-w-4xl py-8">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      <ProfileHeader user={user} isCurrentUser={isCurrentUser} />
      <ProfileTabs userId={params.id} />
    </div>
  )
}
