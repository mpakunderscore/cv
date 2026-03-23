declare const HIT_API_ORIGIN: string

type CounterResponse = {
    uniqueForKey?: number
    uniqueAll?: number
}

const getClientId = (): string => {
    try {
        const storageKey = 'client_id'
        const stored = window.localStorage.getItem(storageKey)
        if (stored) return stored

        const created =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        window.localStorage.setItem(storageKey, created)
        return created
    } catch {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
}

const parseCounterValue = (payload: unknown): number => {
    if (!payload || typeof payload !== 'object') return 0

    const data = payload as CounterResponse
    if (typeof data.uniqueForKey === 'number') return data.uniqueForKey
    if (typeof data.uniqueAll === 'number') return data.uniqueAll
    return 0
}

export const initCounter = async () => {
    const counterNode = document.querySelector<HTMLElement>('[data-role="counter"]')

    try {
        const url = new URL(window.location.href)
        const key = url.pathname === '/' ? 'home' : url.pathname
        const clientId = getClientId()
        const hitUrl = new URL('/api/hit', HIT_API_ORIGIN)
        hitUrl.searchParams.set('key', key)
        hitUrl.searchParams.set('client_id', clientId)
        const response = await fetch(hitUrl.href)

        if (!counterNode) return

        if (!response.ok) {
            counterNode.textContent = 'Unique: —'
            return
        }

        const payload: unknown = await response.json()
        const value = parseCounterValue(payload)
        counterNode.textContent = `Unique: ${value}`
    } catch {
        if (counterNode) {
            counterNode.textContent = 'Unique: —'
        }
    }
}
