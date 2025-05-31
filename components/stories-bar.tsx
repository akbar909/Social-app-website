"use client"

import { StoryUpload } from "@/components/story-upload"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface Story {
  _id: string
  user: { _id: string; name: string; image: string; username: string }
  mediaType: "text" | "image" | "video"
  mediaUrl?: string
  text?: string
  createdAt: string
}

export function StoriesBar() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState<{ story: Story; idx: number; userId: string } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Track viewed stories in localStorage
  const [viewed, setViewed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("viewedStories") || "[]")
      } catch {
        return []
      }
    }
    return []
  })

  const fetchStories = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stories")
      const data = await res.json()
      setStories(data.stories || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStories()
  }, [])

  // Group stories by user
  const userStories = stories.reduce((acc, story) => {
    const uid = story.user._id
    if (!acc[uid]) acc[uid] = []
    acc[uid].push(story)
    return acc
  }, {} as Record<string, Story[]>)

  // Flatten stories for navigation
  const flatStories: { story: Story; idx: number; userId: string }[] = []
  Object.values(userStories).forEach((arr) => {
    arr.forEach((story, idx) => flatStories.push({ story, idx, userId: story.user._id }))
  })

  // Find next/prev story
  const getNextStory = useCallback((current: typeof viewer) => {
    if (!current) return null
    const i = flatStories.findIndex(s => s.story._id === current.story._id)
    return flatStories[i + 1] || null
  }, [flatStories])
  const getPrevStory = useCallback((current: typeof viewer) => {
    if (!current) return null
    const i = flatStories.findIndex(s => s.story._id === current.story._id)
    return flatStories[i - 1] || null
  }, [flatStories])

  // Auto-advance logic
  useEffect(() => {
    if (!viewer) return;
    if (viewer.story.mediaType === "video") {
      // Wait for video end
      if (videoRef.current) {
        const onEnded = () => {
          const next = getNextStory(viewer)
          if (next) setViewer(next)
          else setViewer(null)
        }
        videoRef.current.addEventListener("ended", onEnded)
        return () => {
          if (videoRef.current) videoRef.current.removeEventListener("ended", onEnded)
        }
      }
    } else {
      timerRef.current = setTimeout(() => {
        const next = getNextStory(viewer)
        if (next) setViewer(next)
        else setViewer(null)
      }, 5000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
    // Always return a cleanup function
    return () => {};
  }, [viewer, getNextStory])

  // Pause/resume on hold
  const handleHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (videoRef.current) videoRef.current.pause()
  }
  const handleRelease = () => {
    if (viewer?.story.mediaType === "video" && videoRef.current) videoRef.current.play()
    else {
      timerRef.current = setTimeout(() => {
        const next = getNextStory(viewer)
        if (next) setViewer(next)
        else setViewer(null)
      }, 5000)
    }
  }

  // Mark a story as viewed
  const markViewed = (storyId: string) => {
    setViewed((prev) => {
      if (!prev.includes(storyId)) {
        const updated = [...prev, storyId]
        localStorage.setItem("viewedStories", JSON.stringify(updated))
        return updated
      }
      return prev
    })
  }

  // When a story is opened, mark as viewed
  useEffect(() => {
    if (viewer) markViewed(viewer.story._id)
  }, [viewer])

  // Helper: for each user, are all stories viewed?
  const userStoryStatus = useMemo(() => {
    const status: Record<string, { allViewed: boolean; firstUnviewedIdx: number }> = {}
    Object.entries(userStories).forEach(([uid, arr]) => {
      const unviewedIdx = arr.findIndex(story => !viewed.includes(story._id))
      status[uid] = {
        allViewed: arr.every(story => viewed.includes(story._id)),
        firstUnviewedIdx: unviewedIdx === -1 ? 0 : unviewedIdx,
      }
    })
    return status
  }, [userStories, viewed])

  return (
    <div className="w-full overflow-x-auto py-4 bg-background border-b border-muted">
      <div className="flex items-end gap-4 px-4 min-h-[100px]">
        {/* Add Story */}
        <div className="flex flex-col items-center">
          <StoryUpload onStoryCreated={fetchStories} />
          <span className="text-xs mt-2 font-medium">Your Story</span>
        </div>
        {/* User Stories */}
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-4" />
        ) : (
          Object.entries(userStories).map(([uid, userStoryArr], i) => {
            const first = userStoryArr[0]
            const status = userStoryStatus[uid]
            return (
              <button
                key={first.user._id}
                className="flex flex-col items-center group focus:outline-none"
                onClick={() => setViewer({ story: userStoryArr[status.firstUnviewedIdx], idx: status.firstUnviewedIdx, userId: first.user._id })}
                tabIndex={0}
                aria-label={`View ${first.user.name}'s stories`}
              >
                <div className={`relative h-16 w-16 rounded-full border-4 ${status.allViewed ? 'border-muted-foreground/40' : 'border-blue-500'} group-hover:scale-105 transition-transform overflow-hidden shadow-md`}>
                  <Image
                    src={first.user.image || "/placeholder.svg?height=128&width=128"}
                    alt={first.user.name}
                    fill
                    className="object-cover rounded-full"
                  />
                  {/* Badge for number of stories */}
                  {userStoryArr.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-primary text-white text-xs rounded-full px-1.5 py-0.5 border border-white shadow">{userStoryArr.length}</span>
                  )}
                </div>
                <span className="text-xs mt-2 max-w-[70px] truncate text-center">{first.user.name.split(" ")[0]}</span>
              </button>
            )
          })
        )}
      </div>
      {/* Story Viewer Modal */}
      {viewer && (
        <Dialog open={!!viewer} onOpenChange={() => setViewer(null)}>
          <DialogContent className="max-w-lg w-full flex flex-col items-center">
            <DialogTitle>{viewer.story.user.name}'s Story</DialogTitle>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={viewer.story.user.image || "/placeholder.svg?height=80&width=80"}
                  alt={viewer.story.user.name}
                  width={40}
                  height={40}
                  className="object-cover rounded-full"
                />
              </div>
              <span className="font-semibold text-base">{viewer.story.user.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{new Date(viewer.story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div
              className="w-full flex justify-center items-center min-h-[300px] relative select-none"
              onMouseDown={handleHold}
              onMouseUp={handleRelease}
              onTouchStart={handleHold}
              onTouchEnd={handleRelease}
            >
              {/* Prev/Next navigation */}
              <button
                className="absolute left-0 top-0 h-full w-1/4 z-10 bg-transparent"
                onClick={e => { e.stopPropagation(); const prev = getPrevStory(viewer); if (prev) setViewer(prev); }}
                tabIndex={-1}
                aria-label="Previous story"
              />
              <button
                className="absolute right-0 top-0 h-full w-1/4 z-10 bg-transparent"
                onClick={e => { e.stopPropagation(); const next = getNextStory(viewer); if (next) setViewer(next); else setViewer(null); }}
                tabIndex={-1}
                aria-label="Next story"
              />
              {viewer.story.mediaType === "image" && viewer.story.mediaUrl && (
                <Image src={viewer.story.mediaUrl} alt="Story" width={400} height={500} className="rounded-xl object-contain max-h-[60vh]" />
              )}
              {viewer.story.mediaType === "video" && viewer.story.mediaUrl && (
                <video
                  ref={videoRef}
                  src={viewer.story.mediaUrl}
                  controls
                  autoPlay
                  className="rounded-xl max-h-[60vh] w-full"
                />
              )}
              {viewer.story.mediaType === "text" && (
                <div className="bg-muted rounded-xl p-8 text-lg font-medium w-full text-center min-h-[200px] flex items-center justify-center">
                  {viewer.story.text}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 