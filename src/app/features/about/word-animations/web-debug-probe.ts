import { queryOptional } from '@/lib/dom'

const WEB_KEYWORD_SELECTOR = '.about-keyword-item-web'
const DEBUG_BUILD_SELECTOR = '[data-role="debug-build"]'
const DEBUG_PROBE_ROLE = 'debug-web-probe'
const APPEND_LINE_INTERVAL_MS = 1000

type ProbeEntry = {
    key: string
    value: string
}

const stringifyValue = (value: unknown) => {
    if (value === null || value === undefined) return 'n/a'
    if (typeof value === 'string' && value.trim() === '') return 'n/a'
    return String(value)
}

const readPreference = (query: string) => {
    if (!window.matchMedia) return 'n/a'
    return window.matchMedia(query).matches ? 'yes' : 'no'
}

const createProbeEntries = (): ProbeEntry[] => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const userLanguage = navigator.language
    const userLanguages = navigator.languages?.join(', ')
    const navigatorWithDeviceMemory = navigator as Navigator & { deviceMemory?: number }

    return [
        { key: 'userAgent', value: stringifyValue(navigator.userAgent) },
        { key: 'platform', value: stringifyValue(navigator.platform) },
        { key: 'language', value: stringifyValue(userLanguage) },
        { key: 'languages', value: stringifyValue(userLanguages) },
        { key: 'timeZone', value: stringifyValue(userTimeZone) },
        { key: 'cookieEnabled', value: stringifyValue(navigator.cookieEnabled) },
        { key: 'online', value: stringifyValue(navigator.onLine) },
        { key: 'hardwareConcurrency', value: stringifyValue(navigator.hardwareConcurrency) },
        { key: 'deviceMemoryGB', value: stringifyValue(navigatorWithDeviceMemory.deviceMemory) },
        { key: 'maxTouchPoints', value: stringifyValue(navigator.maxTouchPoints) },
        { key: 'screen', value: `${window.screen.width}x${window.screen.height}` },
        { key: 'viewport', value: `${window.innerWidth}x${window.innerHeight}` },
        { key: 'prefersDark', value: readPreference('(prefers-color-scheme: dark)') },
        { key: 'prefersReducedMotion', value: readPreference('(prefers-reduced-motion: reduce)') },
    ]
}

export const initWebDebugProbe = () => {
    const webKeywordNode = queryOptional<HTMLElement>(WEB_KEYWORD_SELECTOR)
    const debugBuildNode = queryOptional<HTMLElement>(DEBUG_BUILD_SELECTOR)
    if (!webKeywordNode || !debugBuildNode) return

    let isHovered = false
    let isFocused = false
    let timerId: number | null = null
    let probeContainerNode: HTMLDivElement | null = null
    let probeEntries: ProbeEntry[] = []
    let nextEntryIndex = 0

    const stopProbe = () => {
        if (timerId !== null) {
            window.clearInterval(timerId)
            timerId = null
        }
        probeContainerNode?.remove()
        probeContainerNode = null
        probeEntries = []
        nextEntryIndex = 0
    }

    const appendNextEntry = () => {
        if (!probeContainerNode) return
        if (nextEntryIndex >= probeEntries.length) return

        const probeEntry = probeEntries[nextEntryIndex]
        nextEntryIndex += 1

        const lineNode = document.createElement('div')
        lineNode.innerText = `${probeEntry.key}: ${probeEntry.value}`
        probeContainerNode.appendChild(lineNode)
    }

    const startProbe = () => {
        if (probeContainerNode) return

        probeEntries = createProbeEntries()
        nextEntryIndex = 0

        probeContainerNode = document.createElement('div')
        probeContainerNode.setAttribute('data-role', DEBUG_PROBE_ROLE)
        debugBuildNode.appendChild(probeContainerNode)

        timerId = window.setInterval(() => {
            appendNextEntry()
            if (nextEntryIndex >= probeEntries.length && timerId !== null) {
                window.clearInterval(timerId)
                timerId = null
            }
        }, APPEND_LINE_INTERVAL_MS)
    }

    const syncProbe = () => {
        if (isHovered || isFocused) {
            startProbe()
            return
        }
        stopProbe()
    }

    webKeywordNode.addEventListener('mouseenter', () => {
        isHovered = true
        syncProbe()
    })

    webKeywordNode.addEventListener('mouseleave', () => {
        isHovered = false
        syncProbe()
    })

    webKeywordNode.addEventListener('focusin', () => {
        isFocused = true
        syncProbe()
    })

    webKeywordNode.addEventListener('focusout', (event: FocusEvent) => {
        const nextFocusNode = event.relatedTarget
        if (nextFocusNode instanceof Node && webKeywordNode.contains(nextFocusNode)) return
        isFocused = false
        syncProbe()
    })
}
