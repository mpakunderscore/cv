export type BlogGenerateRequest = {
    fields?: {
        id?: string
        title?: string
        paragraphs?: string[]
        notes?: string
    }
    requiredTags?: string[]
}

export type BlogGenerateResponse = {
    id: string
    title: string
    tags: string[]
    paragraphs: string[]
}

const BLOG_GENERATE_PATH = '/api/blog/generate'

const normalizeString = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().slice(0, maxLength)
}

const normalizeStringList = (value: unknown, maxItems: number, maxItemLength: number): string[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((item) => normalizeString(item, maxItemLength))
        .filter((item) => item.length > 0)
        .slice(0, maxItems)
}

const parseGenerateResponse = (payload: unknown): BlogGenerateResponse | null => {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const postPayload = payload as Record<string, unknown>

    const id = normalizeString(postPayload.id, 80)
    const title = normalizeString(postPayload.title, 120)
    const tags = normalizeStringList(postPayload.tags, 16, 32)
    const paragraphs = normalizeStringList(postPayload.paragraphs, 8, 1600)

    if (!id || !title || paragraphs.length === 0) {
        return null
    }

    return {
        id,
        title,
        tags,
        paragraphs,
    }
}

export const requestBlogPostGenerate = async (
    requestPayload: BlogGenerateRequest,
): Promise<BlogGenerateResponse | null> => {
    try {
        const response = await fetch(BLOG_GENERATE_PATH, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
        })

        if (!response.ok) {
            return null
        }

        const responsePayload: unknown = await response.json()
        return parseGenerateResponse(responsePayload)
    } catch {
        return null
    }
}
