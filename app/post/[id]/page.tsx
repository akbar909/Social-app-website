// app/post/[id]/page.tsx

import { CommentSection } from "@/components/comment-section"
import { PostDetail } from "@/components/post-detail"
import { getPostById } from "@/lib/data"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"


export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  // Deeply convert all _id, userId, and createdAt fields to strings
  function serialize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(serialize);
    } else if (obj && typeof obj === 'object' && obj !== null) {
      if (obj instanceof Date) {
        return obj.toISOString();
      }
      const result: any = {};
      for (const key in obj) {
        if ((key === '_id' || key === 'userId') && obj[key] && typeof obj[key].toString === 'function') {
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

  const safePost = serialize(post);

  return (
    <div className="container mx-auto  max-w-2xl py-8">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to home
      </Link>

      <PostDetail post={safePost} />
      <CommentSection postId={id} />
    </div>
  );
}
