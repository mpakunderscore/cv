const WEB_PROBE_TOGGLE_KEY = 'about:web-probe-active'

const parseBoolean = (value: string | null): boolean => value === '1'

export const readWebProbeToggleState = (): boolean => {
    try {
        return parseBoolean(window.localStorage.getItem(WEB_PROBE_TOGGLE_KEY))
    } catch {
        return false
    }
}

export const writeWebProbeToggleState = (isEnabled: boolean) => {
    try {
        if (isEnabled) {
            window.localStorage.setItem(WEB_PROBE_TOGGLE_KEY, '1')
            return
        }
        window.localStorage.removeItem(WEB_PROBE_TOGGLE_KEY)
    } catch {
        // LocalStorage can be blocked in private mode or strict browser settings.
    }
}
