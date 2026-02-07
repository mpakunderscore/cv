import { rerenderBlogPosts } from '@/app/features/blog/blog'
import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'

type View = 'about' | 'cv' | 'blog'

const STORAGE_KEY = 'cv:last-view'

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

type ViewNodes = {
    aboutScreen: HTMLElement
    cvScreen: HTMLElement
    blogScreen: HTMLElement
    cvTileButton: HTMLElement
    blogTileButton: HTMLElement
    cvBackButton: HTMLElement
    blogBackButton: HTMLElement
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
    hideCv(nodes.cvScreen)
    hideBlog(nodes.blogScreen)
}

const showCvInstant = (nodes: ViewNodes) => {
    addClass(nodes.aboutScreen, CONFIG.classes.hidden)
    removeClass(nodes.aboutScreen, 'about-screen-opening')
    removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')
    removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')

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

    hideCv(nodes.cvScreen)
    removeClass(nodes.blogScreen, CONFIG.classes.hidden)
    addClass(nodes.blogScreen, CONFIG.classes.visible)
    removeClass(nodes.blogScreen, 'blog-screen-entering')
    addClass(nodes.blogScreen, 'blog-screen-entered')
}

const animateCvOpen = (nodes: ViewNodes, done: () => void) => {
    addClass(nodes.aboutScreen, 'about-screen-opening')
    addClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')

    window.setTimeout(() => {
        addClass(nodes.aboutScreen, CONFIG.classes.hidden)
        removeClass(nodes.aboutScreen, 'about-screen-opening')
        removeClass(nodes.cvTileButton, 'about-screen-tile-cv-opening')

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

const animateBlogOpen = (nodes: ViewNodes, done: () => void) => {
    addClass(nodes.aboutScreen, 'about-screen-opening')
    addClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')

    window.setTimeout(() => {
        addClass(nodes.aboutScreen, CONFIG.classes.hidden)
        removeClass(nodes.aboutScreen, 'about-screen-opening')
        removeClass(nodes.blogTileButton, 'about-screen-tile-blog-opening')

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

    const setViewInstant = (nextView: View) => {
        currentView = nextView
        writeLastView(nextView)

        if (nextView === 'cv') showCvInstant(nodes)
        else if (nextView === 'blog') {
            rerenderBlogPosts()
            showBlogInstant(nodes)
        }
        else showAboutInstant(nodes)
    }

    const openCv = () => {
        if (currentView === 'cv') return
        if (isOpeningCv) return

        currentView = 'cv'
        writeLastView('cv')

        isOpeningCv = true
        animateCvOpen(nodes, () => {
            isOpeningCv = false
        })
    }

    const openBlog = () => {
        if (currentView === 'blog') return
        if (isOpeningBlog) return

        currentView = 'blog'
        writeLastView('blog')

        rerenderBlogPosts()

        isOpeningBlog = true
        animateBlogOpen(nodes, () => {
            isOpeningBlog = false
        })
    }

    const openAbout = () => {
        if (currentView === 'about') return
        setViewInstant('about')
    }

    const initialView = readLastView() ?? 'about'
    setViewInstant(initialView)

    onClick(cvTileButton, openCv)
    onClick(blogTileButton, openBlog)
    onClick(cvBackButton, openAbout)
    onClick(blogBackButton, openAbout)
}
