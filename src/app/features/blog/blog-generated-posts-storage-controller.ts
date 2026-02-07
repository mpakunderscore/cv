import type { BlogPost } from '@/app/features/blog/blog-posts'

type StoredPostsPayload = {
    version: number
    posts: BlogPost[]
}

const STORAGE_KEY = 'blog:generated-posts'
const STORAGE_VERSION = 1
const MAX_STORED_POSTS = 24

const normalizeText = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') {
        return ''
    }

    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

const normalizeParagraphs = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((paragraph) => normalizeText(paragraph, 1600))
        .filter((paragraph) => paragraph.length > 0)
        .slice(0, 8)
}

const normalizeTags = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return []
    }

    const uniqueTags = new Set<string>()
    for (const tag of value) {
        const normalizedTag = normalizeText(tag, 32).toLowerCase()
        if (normalizedTag.length === 0) {
            continue
        }

        uniqueTags.add(normalizedTag)
    }

    return [...uniqueTags].slice(0, 16)
}

const normalizePost = (value: unknown): BlogPost | null => {
    if (!value || typeof value !== 'object') {
        return null
    }

    const postRecord = value as Record<string, unknown>
    const id = normalizeText(postRecord.id, 80)
    const title = normalizeText(postRecord.title, 120)
    const paragraphs = normalizeParagraphs(postRecord.paragraphs)
    const tags = normalizeTags(postRecord.tags)

    if (id.length === 0 || title.length === 0 || paragraphs.length === 0) {
        return null
    }

    if (tags.length === 0) {
        return {
            id,
            paragraphs,
            title,
        }
    }

    return {
        id,
        paragraphs,
        tags,
        title,
    }
}

const normalizePosts = (value: unknown): BlogPost[] => {
    if (!Array.isArray(value)) {
        return []
    }

    const normalizedPosts: BlogPost[] = []
    const uniqueIds = new Set<string>()

    for (const postValue of value) {
        const normalizedPost = normalizePost(postValue)
        if (!normalizedPost) {
            continue
        }
        if (uniqueIds.has(normalizedPost.id)) {
            continue
        }

        uniqueIds.add(normalizedPost.id)
        normalizedPosts.push(normalizedPost)

        if (normalizedPosts.length >= MAX_STORED_POSTS) {
            break
        }
    }

    return normalizedPosts
}

const parseStoredPosts = (value: string | null): BlogPost[] => {
    if (!value) {
        return []
    }

    try {
        const parsedPayload: unknown = JSON.parse(value)

        if (Array.isArray(parsedPayload)) {
            return normalizePosts(parsedPayload)
        }

        if (!parsedPayload || typeof parsedPayload !== 'object') {
            return []
        }

        const payload = parsedPayload as Partial<StoredPostsPayload>
        if (payload.version !== STORAGE_VERSION) {
            return []
        }

        return normalizePosts(payload.posts)
    } catch {
        return []
    }
}

export const createBlogGeneratedPostsStorageController = () => ({
    loadGeneratedPosts: (): BlogPost[] => {
        try {
            return parseStoredPosts(window.localStorage.getItem(STORAGE_KEY))
        } catch {
            return []
        }
    },

    saveGeneratedPosts: (posts: BlogPost[]) => {
        try {
            const normalizedPosts = normalizePosts(posts)

            if (normalizedPosts.length === 0) {
                window.localStorage.removeItem(STORAGE_KEY)
                return
            }

            const payload: StoredPostsPayload = {
                posts: normalizedPosts,
                version: STORAGE_VERSION,
            }

            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch {
            // LocalStorage can be unavailable in strict/private browser settings.
        }
    },
})
