type D1PreparedStatement = {
    bind: (...values: unknown[]) => D1PreparedStatement
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>
    run: () => Promise<unknown>
}

type D1Database = {
    prepare: (query: string) => D1PreparedStatement
}

type WorkerEnv = {
    DB: D1Database
}

type RequestWithCf = Request & {
    cf?: {
        country?: string
        city?: string
        asn?: number
        asOrganization?: string
    }
}

type VisitCounterRow = {
    total?: number
}

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
}

const jsonResponse = (body: unknown): Response =>
    new Response(JSON.stringify(body), {
        headers: jsonHeaders,
    })

const worker = {
    fetch: async (request: Request, env: WorkerEnv): Promise<Response> => {
        const url = new URL(request.url)

        if (url.pathname === '/api/hit' && request.method === 'GET') {
            const requestWithCf = request as RequestWithCf
            const ip =
                request.headers.get('CF-Connecting-IP') ||
                request.headers.get('x-forwarded-for') ||
                'unknown'

            const userAgent = request.headers.get('User-Agent') || ''
            const referer = request.headers.get('Referer') || ''
            const cf = requestWithCf.cf || {}

            const key = url.searchParams.get('key') || 'default'
            const clientId = url.searchParams.get('client_id') || null

            await env.DB.prepare(
                `
                    INSERT INTO visits
                        (ts, key, ip, user_agent, country, city, referer, asn, as_org, client_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            )
                .bind(
                    Date.now(),
                    key,
                    ip,
                    userAgent,
                    cf.country || null,
                    cf.city || null,
                    referer || null,
                    cf.asn || null,
                    cf.asOrganization || null,
                    clientId
                )
                .run()

            const { results: keyResults } = await env.DB.prepare(
                `
                    SELECT COUNT(*) AS total
                    FROM visits
                    WHERE key = ?
                `
            )
                .bind(key)
                .all<VisitCounterRow>()

            const totalForKey = keyResults[0]?.total ?? 0

            const { results: allResults } = await env.DB.prepare(
                `
                    SELECT COUNT(*) AS total
                    FROM visits
                `
            ).all<VisitCounterRow>()

            const totalAll = allResults[0]?.total ?? 0

            const { results: uniqueKeyResults } = await env.DB.prepare(
                `
                    SELECT COUNT(DISTINCT client_id) AS total
                    FROM visits
                    WHERE key = ? AND client_id IS NOT NULL
                `
            )
                .bind(key)
                .all<VisitCounterRow>()

            const uniqueForKey = uniqueKeyResults[0]?.total ?? 0

            const { results: uniqueAllResults } = await env.DB.prepare(
                `
                    SELECT COUNT(DISTINCT client_id) AS total
                    FROM visits
                    WHERE client_id IS NOT NULL
                `
            ).all<VisitCounterRow>()

            const uniqueAll = uniqueAllResults[0]?.total ?? 0

            return jsonResponse({
                key,
                totalForKey,
                totalAll,
                uniqueForKey,
                uniqueAll,
            })
        }

        return fetch(request)
    },
}

export default worker
