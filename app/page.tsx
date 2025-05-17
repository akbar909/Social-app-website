import { Feed } from "@/components/feed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default async function Home() {
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("Error fetching session:", error)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Feed</h1>
        {session && (
          <Link href="/create">
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">Post</span>
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="following" disabled={!session}>
            Following
          </TabsTrigger>
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
