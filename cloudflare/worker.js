const worker = {
    fetch: async (request, env, ctx) => {
        const url = new URL(request.url)

        // 1. API: return recent visits as JSON (admin only)
        if (url.pathname === '/api/visits' && request.method === 'GET') {
            const adminToken = env.ADMIN_TOKEN
            const headerToken = request.headers.get('X-Admin-Token')

            if (!adminToken || headerToken !== adminToken) {
                return new Response('Forbidden', { status: 403 })
            }

            const limitParam = url.searchParams.get('limit') || '100'
            const limit = Math.min(parseInt(limitParam, 10) || 100, 1000)
            const keyFilter = url.searchParams.get('key')

            let statement
            if (keyFilter) {
                statement = env.DB.prepare(
                    `
                    SELECT ts, key, ip, country, city, referer, user_agent, asn, as_org
                    FROM visits
                    WHERE key = ?
                    ORDER BY id DESC
                    LIMIT ?
                `
                ).bind(keyFilter, limit)
            } else {
                statement = env.DB.prepare(
                    `
                    SELECT ts, key, ip, country, city, referer, user_agent, asn, as_org
                    FROM visits
                    ORDER BY id DESC
                    LIMIT ?
                `
                ).bind(limit)
            }

            const { results } = await statement.all()

            return new Response(JSON.stringify(results), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            })
        }

        // 2. API: hit endpoint by key (log + counters)
        if (url.pathname === '/api/hit' && request.method === 'GET') {
            const ip =
                request.headers.get('CF-Connecting-IP') ||
                request.headers.get('x-forwarded-for') ||
                'unknown'

            const userAgent = request.headers.get('User-Agent') || ''
            const referer = request.headers.get('Referer') || ''
            const cf = request.cf || {}

            const key = url.searchParams.get('key') || 'default'

            // Insert visit row
            await env.DB.prepare(
                `
                    INSERT INTO visits
                        (ts, key, ip, user_agent, country, city, referer, asn, as_org)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    cf.asOrganization || null
                )
                .run()

            // Count total for this key
            const { results: keyResults } = await env.DB.prepare(
                `
                    SELECT COUNT(*) AS total
                    FROM visits
                    WHERE key = ?
                `
            )
                .bind(key)
                .all()

            const totalForKey = keyResults[0]?.total ?? 0

            // Count total for all keys
            const { results: allResults } = await env.DB.prepare(
                `
                    SELECT COUNT(*) AS total
                    FROM visits
                `
            ).all()

            const totalAll = allResults[0]?.total ?? 0

            return new Response(
                JSON.stringify({
                    key,
                    totalForKey,
                    totalAll,
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            )
        }

        // For all other routes just proxy to origin (GitHub Pages or other)
        return fetch(request)
    },
}

export default worker
