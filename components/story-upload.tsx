"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

export function StoryUpload({ onStoryCreated }: { onStoryCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"text" | "image" | "video">("text")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setType(f.type.startsWith("video") ? "video" : "image")
    setPreviewUrl(URL.createObjectURL(f))
  }

  const handleTypeChange = (t: "text" | "image" | "video") => {
    setType(t)
    setFile(null)
    setPreviewUrl(null)
    setText("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      let res
      if (type === "text") {
        res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
      } else if (file) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("mediaType", type)
        if (type === "image") formData.append("text", text)
        res = await fetch("/api/stories", {
          method: "POST",
          body: formData,
        })
      }
      const data = await res?.json()
      if (!res?.ok) throw new Error(data?.error || "Failed to create story")
      toast({ title: "Success", description: "Story created!" })
      setOpen(false)
      setText("")
      setFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      onStoryCreated?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create story",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-16 w-16 flex items-center justify-center border-2 border-primary/60 shadow-md hover:scale-105 transition-transform bg-background"
        onClick={() => setOpen(true)}
        aria-label="Add Story"
      >
        <Plus className="h-8 w-8 text-primary" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
            {/* <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose> */}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 mb-2">
              <Button type="button" variant={type === "text" ? "default" : "outline"} size="sm" onClick={() => handleTypeChange("text")}>Text</Button>
              <Button type="button" variant={type === "image" ? "default" : "outline"} size="sm" onClick={() => handleTypeChange("image")}>Image</Button>
              <Button type="button" variant={type === "video" ? "default" : "outline"} size="sm" onClick={() => handleTypeChange("video")}>Video</Button>
            </div>
            {type === "text" && (
              <Textarea
                placeholder="What's your story?"
                value={text}
                onChange={e => setText(e.target.value)}
                className="resize-none min-h-[100px]"
                maxLength={300}
                required
              />
            )}
            {(type === "image" || type === "video") && (
              <>
                <input
                  type="file"
                  accept={type === "image" ? "image/*" : "video/*"}
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  required
                  title={`Choose a ${type} file`}
                  placeholder={`Choose a ${type} file`}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!!file}>
                  {file ? "File selected" : `Choose ${type}`}
                </Button>
                {previewUrl && (
                  <div className="w-full flex justify-center mt-2">
                    {type === "image" ? (
                      <Image src={previewUrl} alt="Preview" width={200} height={200} className="rounded-xl object-cover max-h-60" />
                    ) : (
                      <video src={previewUrl} controls className="rounded-xl max-h-60 w-full" />
                    )}
                  </div>
                )}
                {type === "image" && (
                  <Textarea
                    placeholder="Add a caption (optional)"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="resize-none min-h-[60px] mt-2"
                    maxLength={200}
                  />
                )}
              </>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Share Story"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 