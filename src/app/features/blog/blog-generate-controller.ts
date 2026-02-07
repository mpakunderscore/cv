import { requestBlogPostGenerate, type BlogGenerateResponse } from '@/app/api/blog-api'

type BlogGenerateDraft = {
    title: string
    body: string
    requiredTags: string[]
}

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

const normalizeTags = (tags: string[]): string[] => {
    const uniqueTags = new Set<string>()

    for (const tag of tags) {
        const normalizedTag = normalizeText(tag).toLowerCase()
        if (normalizedTag.length === 0) {
            continue
        }

        uniqueTags.add(normalizedTag)
    }

    return [...uniqueTags]
}

const toParagraphs = (value: string): string[] => {
    const normalizedBody = value
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map((paragraph) => normalizeText(paragraph))
        .filter((paragraph) => paragraph.length > 0)

    if (normalizedBody.length > 0) {
        return normalizedBody
    }

    const compactBody = normalizeText(value)
    return compactBody ? [compactBody] : []
}

export const createBlogGenerateController = () => ({
    generatePostFromDraft: async (draft: BlogGenerateDraft): Promise<BlogGenerateResponse | null> =>
        requestBlogPostGenerate({
            fields: {
                paragraphs: toParagraphs(draft.body),
                title: normalizeText(draft.title),
            },
            requiredTags: normalizeTags(draft.requiredTags),
        }),
})
