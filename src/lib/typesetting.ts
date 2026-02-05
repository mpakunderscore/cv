import { CONFIG, UI_TEXT } from './config'

export const createTypesetting = (target: HTMLElement | null) => {
    if (!target) return { start: () => undefined, stop: () => undefined }

    let postfix = ''
    let counter = -5

    const tick = () => {
        if (counter > 0) {
            postfix = UI_TEXT.typesettingName.slice(0, counter) + '_'

            if (counter > 5) {
                counter = -5
            }
        } else {
            postfix = postfix === '' ? '_' : ''
        }

        target.innerText = postfix
        counter++
    }

    let timerId: ReturnType<typeof setInterval> | null = null

    const start = () => {
        if (timerId) return
        tick()
        timerId = setInterval(tick, CONFIG.timings.typesettingMs)
    }

    const stop = () => {
        if (!timerId) return
        clearInterval(timerId)
        timerId = null
    }

    return { start, stop }
}
