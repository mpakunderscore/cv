import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'
import { createTypesetting } from '@/lib/typesetting'

const initCvToggle = (
    aboutScreen: HTMLElement | null,
    cvScreen: HTMLElement | null,
    cvTileButton: HTMLElement | null
) => {
    if (!aboutScreen || !cvScreen || !cvTileButton) return

    let isOpening = false

    onClick(cvTileButton, () => {
        if (isOpening) return
        isOpening = true

        addClass(aboutScreen, 'about-screen-opening')
        addClass(cvTileButton, 'about-screen-tile-cv-opening')

        window.setTimeout(() => {
            addClass(aboutScreen, CONFIG.classes.hidden)
            removeClass(aboutScreen, 'about-screen-opening')
            removeClass(cvTileButton, 'about-screen-tile-cv-opening')

            addClass(cvScreen, CONFIG.classes.visible)
            removeClass(cvScreen, CONFIG.classes.hidden)
            addClass(cvScreen, 'cv-screen-entering')

            window.requestAnimationFrame(() => {
                addClass(cvScreen, 'cv-screen-entered')
            })

            isOpening = false
        }, CONFIG.timings.cvOpenMs)
    })
}

const initCvTypesetting = (typesettingNode: HTMLElement | null) => {
    const typesetting = createTypesetting(typesettingNode)
    typesetting.start()
}

const initCvBackButton = (
    aboutScreen: HTMLElement | null,
    cvScreen: HTMLElement | null,
    cvBackButton: HTMLElement | null
) => {
    if (!aboutScreen || !cvScreen || !cvBackButton) return

    onClick(cvBackButton, () => {
        removeClass(cvScreen, CONFIG.classes.visible)
        addClass(cvScreen, CONFIG.classes.hidden)
        removeClass(cvScreen, 'cv-screen-entering')
        removeClass(cvScreen, 'cv-screen-entered')
        removeClass(aboutScreen, CONFIG.classes.hidden)
    })
}

export const initCvPage = () => {
    const aboutScreen = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const cvScreen = queryOptional<HTMLElement>(CONFIG.selectors.cv)
    const cvTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutCvTile)
    const cvBackButton = queryOptional<HTMLElement>(CONFIG.selectors.cvBackButton)
    const typesettingNode = queryOptional<HTMLElement>(CONFIG.selectors.typesettingLast)

    initCvToggle(aboutScreen, cvScreen, cvTileButton)
    initCvBackButton(aboutScreen, cvScreen, cvBackButton)
    initCvTypesetting(typesettingNode)
}
