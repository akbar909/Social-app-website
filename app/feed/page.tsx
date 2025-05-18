import { Feed } from "@/components/feed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function FeedPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Feed</h1>
      </div>

      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        <TabsContent value="latest">
          <Feed type="latest" />
        </TabsContent>
        <TabsContent value="following">
          <Feed type="following" />
        </TabsContent>
      </Tabs>
    </div>
  )
}