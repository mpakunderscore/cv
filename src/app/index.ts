import '../styles/index.css'

import { CONFIG, UI_TEXT } from '../lib/config'
import { addClass, onClick, queryOptional, removeClass } from '../lib/dom'
import { createTypesetting } from '../lib/typesetting'
import { initCounter } from '../lib/who'

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

    createCvToggle(aboutEl, cvEl)
    createThemeController(colorSchemeButton)

    const typesetting = createTypesetting(typesettingTarget)
    typesetting.start()

    void initCounter()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
