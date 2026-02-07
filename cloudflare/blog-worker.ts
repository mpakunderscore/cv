import OpenAI from 'openai'

const ALLOWED_TAGS = [
    'ai',
    'backend',
    'bci',
    'ci',
    'coding',
    'design',
    'ddsa',
    'future',
    'gamedev',
    'hci',
    'ide',
    'infrastructure',
    'llm',
    'management',
    'prompting',
    'product',
    'research',
    'robotics',
    'simulation',
    'tools',
    'typescript',
    'ui',
    'ux',
    'web',
] as const

type AllowedTag = (typeof ALLOWED_TAGS)[number]

type Env = {
    OPENAI_API_KEY?: string
    OPENAI_MODEL?: string
}

type GenerateRequest = {
    fields?: {
        id?: string
        title?: string
        paragraphs?: string[]
        notes?: string
    }
    requiredTags?: string[]
}

type GeneratedPost = {
    id: string
    title: string
    tags: string[]
    paragraphs: string[]
}

const GENERATE_PATH = '/api/blog/generate'

type ProcessEnv = Record<string, string | undefined>

let hasLoadedDotEnv = false

const getNodeProcessEnv = (): ProcessEnv | undefined => {
    const runtime = globalThis as typeof globalThis & {
        process?: {
            versions?: {
                node?: string
            }
            env?: ProcessEnv
        }
    }

    const processNode = runtime.process
    if (!processNode?.versions?.node) {
        return undefined
    }

    return processNode.env
}

const loadDotEnvIfAvailable = async (): Promise<void> => {
    if (hasLoadedDotEnv) {
        return
    }

    const processEnv = getNodeProcessEnv()
    if (!processEnv) {
        hasLoadedDotEnv = true
        return
    }

    try {
        const runtimeNode = globalThis as typeof globalThis & {
            process?: {
                versions?: {
                    node?: string
                }
            }
        }

        if (runtimeNode.process?.versions?.node) {
            const nodeRequire = new Function('return require')() as (id: string) => {
                config?: () => unknown
            }
            const dotenvModule = nodeRequire('dotenv')
            dotenvModule.config?.()
        }
    } catch {
        // Skip when dotenv is not installed in runtime.
    }

    hasLoadedDotEnv = true
}

const getEnvValue = (env: Env, key: 'OPENAI_API_KEY' | 'OPENAI_MODEL'): string => {
    const bindingValue = env[key]
    if (typeof bindingValue === 'string' && bindingValue.trim().length > 0) {
        return bindingValue.trim()
    }

    const processEnv = getNodeProcessEnv()
    const fallbackValue = processEnv?.[key]
    if (typeof fallbackValue === 'string' && fallbackValue.trim().length > 0) {
        return fallbackValue.trim()
    }

    return ''
}

const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })

const normalizeString = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().slice(0, maxLength)
}

const normalizeParagraphs = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((paragraph) => normalizeString(paragraph, 1600))
        .filter((paragraph) => paragraph.length > 0)
        .slice(0, 8)
}

const normalizeTags = (value: unknown): AllowedTag[] => {
    if (!Array.isArray(value)) {
        return []
    }

    const unique = new Set<AllowedTag>()
    for (const candidate of value) {
        if (typeof candidate !== 'string') {
            continue
        }

        const normalized = candidate.trim().toLowerCase()
        if ((ALLOWED_TAGS as readonly string[]).includes(normalized)) {
            unique.add(normalized as AllowedTag)
        }
    }

    return [...unique]
}

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 64)

const hashString = (value: string): number => {
    let hash = 0
    for (const character of value) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0
    }
    return hash
}

const ensureTagCount = (
    tags: AllowedTag[],
    minCount: number,
    maxCount: number,
    seedText: string
): AllowedTag[] => {
    const unique = [...new Set(tags)].slice(0, maxCount) as AllowedTag[]
    if (unique.length >= minCount) {
        return unique
    }

    const missingTags = ALLOWED_TAGS.filter((tag) => !unique.includes(tag))
    if (missingTags.length === 0) {
        return unique
    }

    const seed = hashString(seedText || 'fallback-tags')
    const startIndex = seed % missingTags.length
    for (let offset = 0; unique.length < minCount && offset < missingTags.length; offset += 1) {
        const index = (startIndex + offset) % missingTags.length
        unique.push(missingTags[index] as AllowedTag)
    }

    return unique.slice(0, maxCount)
}

const buildSystemPrompt = (requiredTags: AllowedTag[]): string => {
    const tagsLine =
        requiredTags.length > 0
            ? `TAGS (must use exactly these, no new tags): ${requiredTags.join(', ')}`
            : `TAGS: choose 2-3 tags from this allowlist only: ${ALLOWED_TAGS.join(', ')}.`

    return [
        'Write an original short blog post for a personal tech blog.',
        '',
        tagsLine,
        '',
        'Style / voice:',
        '- Pragmatic, engineering-minded, future-facing.',
        '- Confident but not hype; minimal emotion; no motivational fluff.',
        '- Mostly declarative sentences, occasional rhetorical question.',
        '- Use one concrete metaphor and one operational note (tests, rollback, safety, observability, failure modes).',
        '- Second-person ("you") is welcome, but do not overuse it.',
        '- Optional closing "P.S." with one sharp extra thought.',
        '',
        'Structure:',
        '- 1 title (3-6 words), slightly provocative, not clickbait.',
        '- 2-5 paragraphs, each 1-3 sentences.',
        '- No bullet lists.',
        '',
        'Output format:',
        '- Return JSON only.',
        '- Object keys: id, title, tags, paragraphs.',
        '- id must be kebab-case.',
        '- tags must be an array of 2-3 lowercase values from the allowlist.',
        '- paragraphs must be an array of strings.',
    ].join('\n')
}

const sanitizeModelOutput = (
    rawOutput: unknown,
    requiredTags: AllowedTag[],
    fallbackFields: GenerateRequest['fields']
): GeneratedPost => {
    const parsed =
        typeof rawOutput === 'object' && rawOutput ? (rawOutput as Record<string, unknown>) : {}

    const parsedTitle = normalizeString(parsed.title, 120)
    const fallbackTitle = normalizeString(fallbackFields?.title, 120)
    const title = parsedTitle || fallbackTitle || 'Untitled Draft'

    const parsedParagraphs = normalizeParagraphs(parsed.paragraphs)
    const fallbackParagraphs = normalizeParagraphs(fallbackFields?.paragraphs)
    const paragraphs = (parsedParagraphs.length > 0 ? parsedParagraphs : fallbackParagraphs).slice(
        0,
        6
    )

    const modelTags = normalizeTags(parsed.tags)
    const tags =
        requiredTags.length > 0
            ? [...requiredTags]
            : ensureTagCount(modelTags, 2, 3, `${title} ${paragraphs.join(' ')}`)

    const parsedId = normalizeString(parsed.id, 80)
    const fallbackId = normalizeString(fallbackFields?.id, 80)
    const id = slugify(parsedId || fallbackId || title) || 'generated-post'

    return {
        id,
        title,
        tags,
        paragraphs:
            paragraphs.length > 0
                ? paragraphs
                : ['Describe what you want here or leave blank for random.'],
    }
}

const worker = {
    fetch: async (request: Request, env: Env): Promise<Response> => {
        await loadDotEnvIfAvailable()

        const url = new URL(request.url)

        if (url.pathname !== GENERATE_PATH) {
            return fetch(request)
        }

        if (request.method === 'OPTIONS') {
            return jsonResponse({ ok: true }, 200)
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method Not Allowed' }, 405)
        }

        const apiKey = getEnvValue(env, 'OPENAI_API_KEY')
        if (!apiKey) {
            return jsonResponse({ error: 'OPENAI_API_KEY is not configured' }, 500)
        }

        let body: GenerateRequest
        try {
            body = (await request.json()) as GenerateRequest
        } catch {
            return jsonResponse({ error: 'Invalid JSON body' }, 400)
        }

        const fields = body?.fields ?? {}
        const requiredTags = normalizeTags(body?.requiredTags)
        const abstractMode = requiredTags.length === 0

        const inputPayload = {
            fields: {
                id: normalizeString(fields.id, 80),
                title: normalizeString(fields.title, 120),
                paragraphs: normalizeParagraphs(fields.paragraphs),
                notes: normalizeString(fields.notes, 2000),
            },
            requiredTags,
            mode: abstractMode ? 'abstract_post' : 'tag_driven_post',
            allowedTags: ALLOWED_TAGS,
        }

        const openai = new OpenAI({
            apiKey,
        })

        try {
            const completion = await openai.chat.completions.create({
                model: getEnvValue(env, 'OPENAI_MODEL') || 'gpt-4.1-mini',
                temperature: 0.7,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(requiredTags),
                    },
                    {
                        role: 'user',
                        content: `Current filled fields and generation constraints:\n${JSON.stringify(inputPayload)}`,
                    },
                ],
            })

            const rawContent = completion.choices[0]?.message?.content
            if (!rawContent) {
                return jsonResponse({ error: 'Model returned empty response' }, 502)
            }

            let parsedModelOutput: unknown
            try {
                parsedModelOutput = JSON.parse(rawContent)
            } catch {
                return jsonResponse(
                    { error: 'Model returned non-JSON payload', raw: rawContent },
                    502
                )
            }

            const post = sanitizeModelOutput(parsedModelOutput, requiredTags, fields)
            return jsonResponse(post, 200)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown OpenAI error'
            return jsonResponse({ error: 'OpenAI request failed', details: message }, 502)
        }
    },
}

export default worker
