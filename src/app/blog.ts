import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'

const initBlogToggle = (
    aboutScreen: HTMLElement | null,
    blogScreen: HTMLElement | null,
    blogTileButton: HTMLElement | null
) => {
    if (!aboutScreen || !blogScreen || !blogTileButton) return

    onClick(blogTileButton, () => {
        addClass(aboutScreen, CONFIG.classes.hidden)
        addClass(blogScreen, CONFIG.classes.visible)
        removeClass(blogScreen, CONFIG.classes.hidden)
    })
}

export const initBlogPage = () => {
    const aboutScreen = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const blogScreen = queryOptional<HTMLElement>(CONFIG.selectors.blog)
    const blogTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutBlogTile)

    initBlogToggle(aboutScreen, blogScreen, blogTileButton)
}
