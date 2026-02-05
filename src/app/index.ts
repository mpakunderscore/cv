import '@/styles/index.css'

import { CONFIG, UI_TEXT } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'
import { createTypesetting } from '@/lib/typesetting'
import { initCounter } from '@/lib/who'

declare const BUILD: {
    packageVersion: string
    gitCommit: string
    buildTime: string
}

const createThemeController = (button: HTMLElement | null) => {
    if (!button) return

    const applyTheme = (theme: 'light' | 'dark') => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        button.innerText = UI_TEXT.emoji[theme]
    }

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark')
        applyTheme(isDark ? 'light' : 'dark')
    }

    onClick(button, toggleTheme)
}

const createCvToggle = (aboutEl: HTMLElement | null, cvEl: HTMLElement | null) => {
    if (!aboutEl || !cvEl) return

    const openCv = () => {
        addClass(aboutEl, CONFIG.classes.hidden)
        addClass(cvEl, CONFIG.classes.visible)
        removeClass(cvEl, CONFIG.classes.hidden)
    }

    onClick(aboutEl, openCv)
}

const init = () => {
    const aboutEl = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const cvEl = queryOptional<HTMLElement>(CONFIG.selectors.cv)
    const colorSchemeButton = queryOptional<HTMLElement>(CONFIG.selectors.colorScheme)
    const typesettingTarget = queryOptional<HTMLElement>(CONFIG.selectors.typesettingLast)
    const debugContainer = queryOptional<HTMLElement>(CONFIG.selectors.debug)
    const debugBuildContainer = queryOptional<HTMLElement>(CONFIG.selectors.debugBuild)

    createCvToggle(aboutEl, cvEl)
    createThemeController(colorSchemeButton)

    const typesetting = createTypesetting(typesettingTarget)
    typesetting.start()

    void initCounter()
    renderDebugInfo(debugContainer, debugBuildContainer)
}

const renderDebugInfo = (container: HTMLElement | null, buildTarget: HTMLElement | null) => {
    if (!container || !buildTarget) return

    const lines = [
        BUILD.packageVersion,
        BUILD.gitCommit,
        new Date(BUILD.buildTime).toLocaleString(),
    ]

    const fragment = document.createDocumentFragment()
    for (const value of lines) {
        const line = document.createElement('div')
        line.innerText = value
        fragment.appendChild(line)
    }
    buildTarget.appendChild(fragment)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
