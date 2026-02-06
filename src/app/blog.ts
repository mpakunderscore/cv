import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'

const initBlogToggle = (
    aboutScreen: HTMLElement | null,
    blogScreen: HTMLElement | null,
    blogTileButton: HTMLElement | null
) => {
    if (!aboutScreen || !blogScreen || !blogTileButton) return

    let isOpening = false

    onClick(blogTileButton, () => {
        if (isOpening) return
        isOpening = true

        addClass(aboutScreen, 'about-screen-opening')
        addClass(blogTileButton, 'about-screen-tile-blog-opening')

        window.setTimeout(() => {
            addClass(aboutScreen, CONFIG.classes.hidden)
            removeClass(aboutScreen, 'about-screen-opening')
            removeClass(blogTileButton, 'about-screen-tile-blog-opening')

            addClass(blogScreen, CONFIG.classes.visible)
            removeClass(blogScreen, CONFIG.classes.hidden)
            addClass(blogScreen, 'blog-screen-entering')

            window.requestAnimationFrame(() => {
                addClass(blogScreen, 'blog-screen-entered')
            })

            isOpening = false
        }, CONFIG.timings.blogOpenMs)
    })
}

const initBlogBackButton = (
    aboutScreen: HTMLElement | null,
    blogScreen: HTMLElement | null,
    blogBackButton: HTMLElement | null
) => {
    if (!aboutScreen || !blogScreen || !blogBackButton) return

    onClick(blogBackButton, () => {
        removeClass(blogScreen, CONFIG.classes.visible)
        addClass(blogScreen, CONFIG.classes.hidden)
        removeClass(blogScreen, 'blog-screen-entering')
        removeClass(blogScreen, 'blog-screen-entered')
        removeClass(aboutScreen, CONFIG.classes.hidden)
    })
}

export const initBlogPage = () => {
    const aboutScreen = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const blogScreen = queryOptional<HTMLElement>(CONFIG.selectors.blog)
    const blogTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutBlogTile)
    const blogBackButton = queryOptional<HTMLElement>(CONFIG.selectors.blogBackButton)

    initBlogToggle(aboutScreen, blogScreen, blogTileButton)
    initBlogBackButton(aboutScreen, blogScreen, blogBackButton)
}
