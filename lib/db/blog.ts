import { adminClient } from '@/lib/supabase/admin'
import type { BlogPost } from '@/types/database'

export async function getPublishedPosts(options: {
  page?: number
  limit?: number
  city?: string
  tag?: string
  hotelId?: string
} = {}): Promise<{ posts: BlogPost[]; total: number }> {
  const { page = 1, limit = 10, city, tag, hotelId } = options

  let query = adminClient
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .eq('is_deleted', false)

  if (city) query = query.ilike('city', `%${city}%`)
  if (hotelId) query = query.eq('hotel_id', hotelId)
  if (tag) query = query.contains('tags', [tag])

  const from = (page - 1) * limit
  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getPublishedPosts: ${error.message}`)
  return { posts: data ?? [], total: count ?? 0 }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await adminClient
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getPostBySlug: ${error.message}`)
  }
  return data
}

export async function getAllPostsAdmin(options: {
  page?: number
  limit?: number
} = {}): Promise<{ posts: BlogPost[]; total: number }> {
  const { page = 1, limit = 20 } = options

  const from = (page - 1) * limit
  const { data, error, count } = await adminClient
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (error) throw new Error(`getAllPostsAdmin: ${error.message}`)
  return { posts: data ?? [], total: count ?? 0 }
}

export async function createPost(
  data: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
): Promise<BlogPost> {
  const { data: post, error } = await adminClient
    .from('blog_posts')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`createPost: ${error.message}`)
  return post
}

export async function updatePost(
  id: string,
  data: Partial<Omit<BlogPost, 'id' | 'created_at'>>
): Promise<BlogPost> {
  const { data: post, error } = await adminClient
    .from('blog_posts')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updatePost: ${error.message}`)
  return post
}

export async function publishPost(id: string): Promise<void> {
  const { error } = await adminClient
    .from('blog_posts')
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`publishPost: ${error.message}`)
}

export async function softDeletePost(id: string): Promise<void> {
  const { error } = await adminClient
    .from('blog_posts')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeletePost: ${error.message}`)
}

export async function getPostSlugs(): Promise<{ slug: string }[]> {
  const { data, error } = await adminClient
    .from('blog_posts')
    .select('slug')
    .eq('is_published', true)
    .eq('is_deleted', false)

  if (error) throw new Error(`getPostSlugs: ${error.message}`)
  return data
}
