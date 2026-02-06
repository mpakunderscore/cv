import '@/styles/index.css'

import { initBlogPage } from '@/app/blog'
import { initCvPage } from '@/app/cv'
import { CONFIG, UI_TEXT } from '@/lib/config'
import { onClick, queryOptional } from '@/lib/dom'
import { initCounter } from '@/lib/who'

declare const BUILD: {
    packageVersion: string
    gitCommit: string
    buildTime: string
}

const createThemeController = (themeToggleButton: HTMLElement | null) => {
    if (!themeToggleButton) return

    const applyTheme = (theme: 'light' | 'dark') => {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        themeToggleButton.innerText = UI_TEXT.emoji[theme]
    }

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark')
        applyTheme(isDark ? 'light' : 'dark')
    }

    onClick(themeToggleButton, toggleTheme)
}

const init = () => {
    const themeToggleButton = queryOptional<HTMLElement>(CONFIG.selectors.colorScheme)
    const debugPanel = queryOptional<HTMLElement>(CONFIG.selectors.debug)
    const debugBuildPanel = queryOptional<HTMLElement>(CONFIG.selectors.debugBuild)

    initCvPage()
    initBlogPage()
    createThemeController(themeToggleButton)

    void initCounter()
    renderDebugInfo(debugPanel, debugBuildPanel)
}

const renderDebugInfo = (container: HTMLElement | null, buildTarget: HTMLElement | null) => {
    if (!container || !buildTarget) return

    const buildDate = new Date(BUILD.buildTime).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const lines = [
        BUILD.packageVersion,
        BUILD.gitCommit,
        buildDate,
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
