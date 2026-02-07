import { CONFIG } from '@/lib/config'
import { queryOptional } from '@/lib/dom'
import { createTypesetting } from '@/lib/typesetting'

const initCvTypesetting = (typesettingNode: HTMLElement | null) => {
    const typesetting = createTypesetting(typesettingNode)
    typesetting.start()
}

export const initCvPage = () => {
    const typesettingNode = queryOptional<HTMLElement>(CONFIG.selectors.typesettingLast)

    initCvTypesetting(typesettingNode)
}
