import { onClick } from '@/lib/dom'

const FONT_STORAGE_KEY = 'debug-font-id'

const FONT_OPTIONS = [
    { id: 'manrope', label: 'Manrope', family: "'Manrope', sans-serif" },
    { id: 'inter', label: 'Inter', family: "'Inter', sans-serif" },
    { id: 'ibmplex', label: 'IBM Plex', family: "'IBM Plex Sans', sans-serif" },
    { id: 'source3', label: 'Source 3', family: "'Source Sans 3', sans-serif" },
    { id: 'onest', label: 'Onest', family: "'Onest', sans-serif" },
] as const

type FontOption = (typeof FONT_OPTIONS)[number]
const DEFAULT_FONT_ID: FontOption['id'] = 'source3'

export const createFontController = (buildPanel: HTMLElement | null) => {
    if (!buildPanel) return

    const activeOptions = new Map<FontOption['id'], HTMLDivElement>()

    const setActiveOption = (fontId: FontOption['id']) => {
        for (const [currentId, fontOptionNode] of activeOptions) {
            const isActive = currentId === fontId
            fontOptionNode.classList.toggle('is-active', isActive)
        }
    }

    const applyFont = (fontOption: FontOption) => {
        document.documentElement.style.setProperty('--font-family-base', fontOption.family)
        localStorage.setItem(FONT_STORAGE_KEY, fontOption.id)
        setActiveOption(fontOption.id)
    }

    const savedFontId = localStorage.getItem(FONT_STORAGE_KEY)
    const initialFont =
        FONT_OPTIONS.find((fontOption) => fontOption.id === savedFontId) ??
        FONT_OPTIONS.find((fontOption) => fontOption.id === DEFAULT_FONT_ID) ??
        FONT_OPTIONS[0]

    const fragment = document.createDocumentFragment()
    for (const fontOption of FONT_OPTIONS) {
        const fontOptionNode = document.createElement('div')
        fontOptionNode.className = 'debug-font-option'
        fontOptionNode.innerText = fontOption.label
        onClick(fontOptionNode, () => applyFont(fontOption))
        activeOptions.set(fontOption.id, fontOptionNode)
        fragment.appendChild(fontOptionNode)
    }

    buildPanel.appendChild(fragment)
    applyFont(initialFont)
}
