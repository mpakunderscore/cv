import { rerenderBlogPosts } from '@/app/features/blog/blog'
import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'

type View = 'about' | 'cv' | 'blog'
type HistoryMode = 'push' | 'replace'
type ViewHistoryState = {
    step: number
    view: View
}

const STORAGE_KEY = 'cv:last-view'
const MOBILE_OPEN_MEDIA_QUERY = '(max-width: 600px)'
const HISTORY_STATE_KEY = 'cv:view-state'

const readLastView = (): View | null => {
    try {
        const value = window.localStorage.getItem(STORAGE_KEY)
        if (value === 'about' || value === 'cv' || value === 'blog') return value
        return null
    } catch {
        return null
    }
}

const writeLastView = (view: View) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, view)
    } catch {
        // Ignore
    }
}

const readHistoryState = (): ViewHistoryState | null => {
    const state = window.history.state
    if (!state || typeof state !== 'object') return null

    const historyState = (state as Record<string, unknown>)[HISTORY_STATE_KEY]
    if (!historyState || typeof historyState !== 'object') return null

    const view = (historyState as Record<string, unknown>).view
    const step = (historyState as Record<string, unknown>).step
    if (view !== 'about' && view !== 'cv' && view !== 'blog') return null
    if (typeof step !== 'number' || !Number.isInteger(step) || step < 0) return null

    return { view, step }
}

const writeHistoryState = (view: View, step: number, mode: HistoryMode) => {
    const currentState = window.history.state
    const stateRecord =
        currentState && typeof currentState === 'object'
            ? (currentState as Record<string, unknown>)
            : {}

    const nextState = {
        ...stateRecord,
        [HISTORY_STATE_KEY]: { step, view },
    }

    if (mode === 'push') {
        window.history.pushState(nextState, '')
        return
    }

    window.history.replaceState(nextState, '')
}

type ViewNodes = {
    aboutScreen: HTMLElement
    cvScreen: HTMLElement
    blogScreen: HTMLElement
    cvTileButton: HTMLElement
    blogTileButton: HTMLElement
    cvBackButton: HTMLElement
    blogBackButton: HTMLElement
}

const isMobileOpenAnimation = () => {
    if (typeof window.matchMedia === 'function') {
        return window.matchMedia(MOBILE_OPEN_MEDIA_QUERY).matches
    }

    return window.innerWidth <= 600
}

const applyMobileTileOpenAnimation = (tileButton: HTMLElement) => {
    const tileRect = tileButton.getBoundingClientRect()
    const tileCenterY = tileRect.top + tileRect.height / 2
    const viewportCenterY = window.innerHeight / 2
    const shiftY = viewportCenterY - tileCenterY

    tileButton.style.setProperty('--about-mobile-open-shift-y', `${shiftY}px`)
    addClass(tileButton, 'about-screen-tile-mobile-opening')
}

const clearMobileTileOpenAnimation = (tileButton: HTMLElement) => {
    removeClass(tileButton, 'about-screen-tile-mobile-opening')
    tileButton.style.removeProperty('--about-mobile-open-shift-y')
}

const hideCv = (cvScreen: HTMLElement) => {
    removeClass(cvScreen, CONFIG.classes.visible)
    addClass(cvScreen, CONFIG.classes.hidden)
    removeClass(cvScreen, 'cv-screen-entering')
    removeClass(cvScreen, 'cv-screen-entered')
}

const hideBlog = (blogScreen: HTMLElement) => {
    removeClass(blogScreen, CONFIG.classes.visible)
    addClass(blogScreen, CONFIG.classes.hidden)
    removeClass(blogScreen, 'blog-screen-entering')
    removeClass(blogScreen, 'blog-screen-entered')
}

const showAboutInstant = (nodes: ViewNodes) => {
    removeClass(nodes.aboutScreen, CONFIG.classes.hidden)
    removeClass(nodes.aboutScreen, 'about-screen-opening')
    removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')
    removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')
    clearMobileTileOpenAnimation(nodes.cvTileButton)
    clearMobileTileOpenAnimation(nodes.blogTileButton)
    hideCv(nodes.cvScreen)
    hideBlog(nodes.blogScreen)
}

const showCvInstant = (nodes: ViewNodes) => {
    addClass(nodes.aboutScreen, CONFIG.classes.hidden)
    removeClass(nodes.aboutScreen, 'about-screen-opening')
    removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')
    removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')
    clearMobileTileOpenAnimation(nodes.cvTileButton)
    clearMobileTileOpenAnimation(nodes.blogTileButton)

    hideBlog(nodes.blogScreen)
    removeClass(nodes.cvScreen, CONFIG.classes.hidden)
    addClass(nodes.cvScreen, CONFIG.classes.visible)
    removeClass(nodes.cvScreen, 'cv-screen-entering')
    addClass(nodes.cvScreen, 'cv-screen-entered')
}

const showBlogInstant = (nodes: ViewNodes) => {
    addClass(nodes.aboutScreen, CONFIG.classes.hidden)
    removeClass(nodes.aboutScreen, 'about-screen-opening')
    removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')
    removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')
    clearMobileTileOpenAnimation(nodes.cvTileButton)
    clearMobileTileOpenAnimation(nodes.blogTileButton)

    hideCv(nodes.cvScreen)
    removeClass(nodes.blogScreen, CONFIG.classes.hidden)
    addClass(nodes.blogScreen, CONFIG.classes.visible)
    removeClass(nodes.blogScreen, 'blog-screen-entering')
    addClass(nodes.blogScreen, 'blog-screen-entered')
}

const animateCvOpen = (nodes: ViewNodes, shouldApply: () => boolean, done: () => void) => {
    const useMobileOpenAnimation = isMobileOpenAnimation()

    addClass(nodes.aboutScreen, 'about-screen-opening')
    if (useMobileOpenAnimation) applyMobileTileOpenAnimation(nodes.cvTileButton)
    else addClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')

    window.setTimeout(() => {
        if (!shouldApply()) {
            removeClass(nodes.aboutScreen, 'about-screen-opening')
            if (useMobileOpenAnimation) clearMobileTileOpenAnimation(nodes.cvTileButton)
            else removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')
            done()
            return
        }

        addClass(nodes.aboutScreen, CONFIG.classes.hidden)
        removeClass(nodes.aboutScreen, 'about-screen-opening')
        if (useMobileOpenAnimation) clearMobileTileOpenAnimation(nodes.cvTileButton)
        else removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')

        hideBlog(nodes.blogScreen)
        addClass(nodes.cvScreen, CONFIG.classes.visible)
        removeClass(nodes.cvScreen, CONFIG.classes.hidden)
        addClass(nodes.cvScreen, 'cv-screen-entering')

        window.requestAnimationFrame(() => {
            addClass(nodes.cvScreen, 'cv-screen-entered')
        })

        done()
    }, CONFIG.timings.cvOpenMs)
}

const animateBlogOpen = (nodes: ViewNodes, shouldApply: () => boolean, done: () => void) => {
    const useMobileOpenAnimation = isMobileOpenAnimation()

    addClass(nodes.aboutScreen, 'about-screen-opening')
    if (useMobileOpenAnimation) applyMobileTileOpenAnimation(nodes.blogTileButton)
    else addClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')

    window.setTimeout(() => {
        if (!shouldApply()) {
            removeClass(nodes.aboutScreen, 'about-screen-opening')
            if (useMobileOpenAnimation) clearMobileTileOpenAnimation(nodes.blogTileButton)
            else removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')
            done()
            return
        }

        addClass(nodes.aboutScreen, CONFIG.classes.hidden)
        removeClass(nodes.aboutScreen, 'about-screen-opening')
        if (useMobileOpenAnimation) clearMobileTileOpenAnimation(nodes.blogTileButton)
        else removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')

        hideCv(nodes.cvScreen)
        addClass(nodes.blogScreen, CONFIG.classes.visible)
        removeClass(nodes.blogScreen, CONFIG.classes.hidden)
        addClass(nodes.blogScreen, 'blog-screen-entering')

        window.requestAnimationFrame(() => {
            addClass(nodes.blogScreen, 'blog-screen-entered')
        })

        done()
    }, CONFIG.timings.blogOpenMs)
}

export const initViewController = () => {
    const aboutScreen = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const cvScreen = queryOptional<HTMLElement>(CONFIG.selectors.cv)
    const blogScreen = queryOptional<HTMLElement>(CONFIG.selectors.blog)
    const cvTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutCvTile)
    const blogTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutBlogTile)
    const cvBackButton = queryOptional<HTMLElement>(CONFIG.selectors.cvBackButton)
    const blogBackButton = queryOptional<HTMLElement>(CONFIG.selectors.blogBackButton)

    if (
        !aboutScreen ||
        !cvScreen ||
        !blogScreen ||
        !cvTileButton ||
        !blogTileButton ||
        !cvBackButton ||
        !blogBackButton
    ) {
        return
    }

    const nodes: ViewNodes = {
        aboutScreen,
        cvScreen,
        blogScreen,
        cvTileButton,
        blogTileButton,
        cvBackButton,
        blogBackButton,
    }

    let isOpeningCv = false
    let isOpeningBlog = false
    let currentView: View = 'about'
    let historyStep = 0

    const setViewInstant = (nextView: View) => {
        currentView = nextView
        writeLastView(nextView)

        if (nextView === 'cv') showCvInstant(nodes)
        else if (nextView === 'blog') {
            rerenderBlogPosts()
            showBlogInstant(nodes)
        } else showAboutInstant(nodes)
    }

    const openCv = () => {
        if (currentView === 'cv') return
        if (isOpeningCv) return

        currentView = 'cv'
        writeLastView('cv')
        historyStep += 1
        writeHistoryState('cv', historyStep, 'push')

        isOpeningCv = true
        animateCvOpen(
            nodes,
            () => currentView === 'cv',
            () => {
                isOpeningCv = false
            }
        )
    }

    const openBlog = () => {
        if (currentView === 'blog') return
        if (isOpeningBlog) return

        currentView = 'blog'
        writeLastView('blog')
        historyStep += 1
        writeHistoryState('blog', historyStep, 'push')

        rerenderBlogPosts()

        isOpeningBlog = true
        animateBlogOpen(
            nodes,
            () => currentView === 'blog',
            () => {
                isOpeningBlog = false
            }
        )
    }

    const openAbout = () => {
        if (currentView === 'about') return

        if (historyStep > 0) {
            window.history.back()
            return
        }

        setViewInstant('about')
        writeHistoryState('about', historyStep, 'replace')
    }

    const onPopState = () => {
        const nextHistoryState = readHistoryState()
        if (!nextHistoryState) {
            historyStep = 0
            setViewInstant('about')
            writeHistoryState('about', historyStep, 'replace')
            return
        }

        historyStep = nextHistoryState.step
        setViewInstant(nextHistoryState.view)
    }

    const initialHistoryState = readHistoryState()
    if (initialHistoryState) {
        historyStep = initialHistoryState.step
    }

    const initialView = initialHistoryState?.view ?? readLastView() ?? 'about'
    setViewInstant(initialView)
    writeHistoryState(initialView, historyStep, 'replace')

    onClick(cvTileButton, openCv)
    onClick(blogTileButton, openBlog)
    onClick(cvBackButton, openAbout)
    onClick(blogBackButton, openAbout)
    window.addEventListener('popstate', onPopState)
}
