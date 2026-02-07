import '@/styles/index.css'

import { createFontController } from '@/app/core/font-controller'
import { createRenderGateController } from '@/app/core/render-gate-controller'
import { initViewController } from '@/app/core/view-controller'
import { initAboutKeywords } from '@/app/features/about/about-keywords'
import { initAiRandomAnimation } from '@/app/features/about/word-animations/ai-random-animation'
import { initBciFrequencyBlink } from '@/app/features/about/word-animations/bci-frequency-blink'
import { initGamedevLetterGame } from '@/app/features/about/word-animations/gamedev-letter-game'
import { initRoboticsSpacingAnimation } from '@/app/features/about/word-animations/robotics-spacing-animation'
import { initWebDebugProbe } from '@/app/features/about/word-animations/web-debug-probe'
import { initBlogPage } from '@/app/features/blog/blog'
import { initCvPage } from '@/app/features/cv/cv'
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
    initBciFrequencyBlink()
    initGamedevLetterGame()
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
