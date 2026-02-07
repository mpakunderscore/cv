import '@/styles/index.css'

import { initAboutKeywords } from '@/app/about-keywords'
import { initBlogPage } from '@/app/blog'
import { initCvPage } from '@/app/cv'
import { createFontController } from '@/app/font-controller'
import { createRenderGateController } from '@/app/render-gate-controller'
import { initViewController } from '@/app/view-controller'
import { initAiRandomAnimation } from '@/app/word-animations/ai-random-animation'
import { initRoboticsSpacingAnimation } from '@/app/word-animations/robotics-spacing-animation'
import { initWebDebugProbe } from '@/app/word-animations/web-debug-probe'
import { CONFIG, UI_TEXT } from '@/lib/config'
import { onClick, queryOptional } from '@/lib/dom'

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
    initAboutKeywords()
    initAiRandomAnimation()
    initRoboticsSpacingAnimation()
    initWebDebugProbe()
    initViewController()
    createThemeController(themeToggleButton)
    renderDebugInfo(debugPanel, debugBuildPanel)
    createFontController(debugBuildPanel)
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

const waitForDomReady = async () => {
    if (document.readyState !== 'loading') return

    await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
    })
}

const bootstrap = async () => {
    const renderGateController = createRenderGateController()

    try {
        await waitForDomReady()
        init()
        await renderGateController.waitForReadyAndReveal()
    } catch {
        renderGateController.reveal()
    }
}

void bootstrap()
