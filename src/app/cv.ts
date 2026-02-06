import { CONFIG } from '@/lib/config'
import { addClass, onClick, queryOptional, removeClass } from '@/lib/dom'
import { createTypesetting } from '@/lib/typesetting'

const initCvToggle = (
    aboutScreen: HTMLElement | null,
    cvScreen: HTMLElement | null,
    cvTileButton: HTMLElement | null
) => {
    if (!aboutScreen || !cvScreen || !cvTileButton) return

    onClick(cvTileButton, () => {
        addClass(aboutScreen, CONFIG.classes.hidden)
        addClass(cvScreen, CONFIG.classes.visible)
        removeClass(cvScreen, CONFIG.classes.hidden)
    })
}

const initCvTypesetting = (typesettingNode: HTMLElement | null) => {
    const typesetting = createTypesetting(typesettingNode)
    typesetting.start()
}

export const initCvPage = () => {
    const aboutScreen = queryOptional<HTMLElement>(CONFIG.selectors.about)
    const cvScreen = queryOptional<HTMLElement>(CONFIG.selectors.cv)
    const cvTileButton = queryOptional<HTMLElement>(CONFIG.selectors.aboutCvTile)
    const typesettingNode = queryOptional<HTMLElement>(CONFIG.selectors.typesettingLast)

    initCvToggle(aboutScreen, cvScreen, cvTileButton)
    initCvTypesetting(typesettingNode)
}
