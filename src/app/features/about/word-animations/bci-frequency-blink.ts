import { queryOptional } from '@/lib/dom'

const BCI_KEYWORD_SELECTOR = '.about-keyword-item-bci'
const BCI_WORD_SELECTOR = '.about-bci-word'
const BCI_BRIGHTNESS_ON = 1
const BCI_BRIGHTNESS_OFF = 0.3
const BCI_MIN_INTERVAL_MS = 700
const BCI_MAX_INTERVAL_MS = 1000
const BCI_FREQUENCY_UPDATE_MS = 3000

type BciLetterState = {
    intervalMs: number
    isDimmed: boolean
    letterNode: HTMLSpanElement
    timeoutId: number | null
}

const getRandomIntervalMs = () => {
    const intervalRange = BCI_MAX_INTERVAL_MS - BCI_MIN_INTERVAL_MS + 1
    return BCI_MIN_INTERVAL_MS + Math.floor(Math.random() * intervalRange)
}

const setLetterBrightness = (letterNode: HTMLSpanElement, brightness: number) => {
    letterNode.style.filter = `brightness(${brightness})`
}

const createLetterNodes = (bciWordNode: HTMLElement) => {
    const letters = bciWordNode.innerText.trim().split('')
    bciWordNode.innerText = ''

    const fragment = document.createDocumentFragment()
    const letterNodes: HTMLSpanElement[] = []

    for (const letter of letters) {
        const letterNode = document.createElement('span')
        letterNode.className = 'about-bci-letter'
        letterNode.innerText = letter
        setLetterBrightness(letterNode, BCI_BRIGHTNESS_ON)
        fragment.appendChild(letterNode)
        letterNodes.push(letterNode)
    }

    bciWordNode.appendChild(fragment)
    return letterNodes
}

export const initBciFrequencyBlink = () => {
    const bciKeywordNode = queryOptional<HTMLElement>(BCI_KEYWORD_SELECTOR)
    const bciWordNode = bciKeywordNode?.querySelector<HTMLElement>(BCI_WORD_SELECTOR)
    if (!bciKeywordNode || !bciWordNode) return

    const letterNodes = createLetterNodes(bciWordNode)
    if (letterNodes.length === 0) return

    const letterStates: BciLetterState[] = letterNodes.map((letterNode) => ({
        intervalMs: getRandomIntervalMs(),
        isDimmed: false,
        letterNode,
        timeoutId: null,
    }))

    let isRunning = false
    let frequencyTimerId: number | null = null

    const clearLetterTimer = (letterState: BciLetterState) => {
        if (letterState.timeoutId === null) return
        window.clearTimeout(letterState.timeoutId)
        letterState.timeoutId = null
    }

    const clearAllLetterTimers = () => {
        for (const letterState of letterStates) {
            clearLetterTimer(letterState)
        }
    }

    const applyBaseState = () => {
        for (const letterState of letterStates) {
            letterState.isDimmed = false
            setLetterBrightness(letterState.letterNode, BCI_BRIGHTNESS_ON)
        }
    }

    const scheduleBlink = (letterState: BciLetterState) => {
        if (!isRunning) return

        clearLetterTimer(letterState)
        letterState.timeoutId = window.setTimeout(() => {
            if (!isRunning) return

            letterState.isDimmed = !letterState.isDimmed
            setLetterBrightness(
                letterState.letterNode,
                letterState.isDimmed ? BCI_BRIGHTNESS_OFF : BCI_BRIGHTNESS_ON
            )
            scheduleBlink(letterState)
        }, letterState.intervalMs)
    }

    const refreshFrequencies = () => {
        for (const letterState of letterStates) {
            letterState.intervalMs = getRandomIntervalMs()
            if (isRunning) {
                scheduleBlink(letterState)
            }
        }
    }

    const startAnimation = () => {
        if (isRunning) return
        isRunning = true
        refreshFrequencies()

        frequencyTimerId = window.setInterval(() => {
            refreshFrequencies()
        }, BCI_FREQUENCY_UPDATE_MS)
    }

    const stopAnimation = () => {
        if (!isRunning) return
        isRunning = false

        if (frequencyTimerId !== null) {
            window.clearInterval(frequencyTimerId)
            frequencyTimerId = null
        }

        clearAllLetterTimers()
        applyBaseState()
    }

    const syncByVisibility = () => {
        if (document.visibilityState === 'hidden') {
            stopAnimation()
            return
        }
        startAnimation()
    }

    document.addEventListener('visibilitychange', syncByVisibility)

    applyBaseState()
    syncByVisibility()
}
