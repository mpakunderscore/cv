import {
    createWebProbeEntries,
    type ProbeEntry,
} from '@/app/features/about/word-animations/web-probe-entries'
import { queryOptional } from '@/lib/dom'

const WEB_KEYWORD_SELECTOR = '.about-keyword-item-web'
const DEBUG_BUILD_SELECTOR = '[data-role="debug-build"]'
const DEBUG_PROBE_ROLE = 'debug-web-probe'
// Make Web probe lines appear 3x faster on hover/focus/toggle.
const APPEND_LINE_INTERVAL_MS = 1000 / 3
const WEB_PROBE_ACTIVE_CLASS = 'is-probe-active'

export const initWebDebugProbe = () => {
    const webKeywordNode = queryOptional<HTMLElement>(WEB_KEYWORD_SELECTOR)
    const debugBuildNode = queryOptional<HTMLElement>(DEBUG_BUILD_SELECTOR)
    if (!webKeywordNode || !debugBuildNode) return

    let isHovered = false
    let isFocused = false
    let isToggledOn = false
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

        probeEntries = createWebProbeEntries()
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
        if (isHovered || isFocused || isToggledOn) {
            startProbe()
            return
        }
        stopProbe()
    }

    const renderToggleState = () => {
        webKeywordNode.classList.toggle(WEB_PROBE_ACTIVE_CLASS, isToggledOn)
        webKeywordNode.setAttribute('aria-pressed', String(isToggledOn))
    }

    const toggleProbe = () => {
        isToggledOn = !isToggledOn
        if (!isToggledOn) {
            isHovered = false
            isFocused = false
            webKeywordNode.blur()
        }
        renderToggleState()
        syncProbe()
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

    webKeywordNode.addEventListener('click', toggleProbe)

    webKeywordNode.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggleProbe()
    })

    renderToggleState()
    syncProbe()
}
