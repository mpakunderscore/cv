import { CONFIG } from './config'

export const initCounter = async () => {
    const counterEl = document.querySelector<HTMLElement>(CONFIG.selectors.counter)
    if (!counterEl) return

    const url = new URL(window.location.href)
    const response = await fetch(`/api/counter?path=${encodeURIComponent(url.pathname)}`)
    const data: { value?: number | string } = await response.json()
    counterEl.textContent = `Visits: ${String(data.value ?? '')}`
}
