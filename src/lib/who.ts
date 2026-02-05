import { CONFIG } from './config'

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

export const initCounter = async () => {
    const counterEl = document.querySelector<HTMLElement>(CONFIG.selectors.counter)
    if (!counterEl) return

    const url = new URL(window.location.href)
    const key = url.pathname === '/' ? 'home' : url.pathname
    const clientId = getClientId()
    const response = await fetch(
        `/api/hit?key=${encodeURIComponent(key)}&client_id=${encodeURIComponent(clientId)}`
    )
    const data: { uniqueForKey?: number; uniqueAll?: number } = await response.json()
    const value = data.uniqueForKey ?? data.uniqueAll ?? 0
    counterEl.textContent = `Unique: ${value}`
}
