export interface User {
  _id: string
  name: string
  username: string
  email: string
  image?: string
  bio?: string
  followers?: number
  following?: number
  postCount?: number
  isFollowing?: boolean
  createdAt: string
}

export interface Post {
  _id: string
  content?: string
  mediaUrls?: string[]
  author: User
  likes?: any[]
  likeCount?: number
  commentCount?: number
  isLiked?: boolean
  createdAt: string
}

export interface Comment {
  _id: string
  content: string
  author: User
  postId: string
  createdAt: string
}
