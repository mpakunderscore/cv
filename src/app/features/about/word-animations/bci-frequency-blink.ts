import { queryOptional } from '@/lib/dom'

const BCI_KEYWORD_SELECTOR = '.about-keyword-item-bci'
const BCI_WORD_SELECTOR = '.about-bci-word'
const BCI_LETTER_SELECTOR = '.about-bci-letter'
const BCI_BRIGHTNESS_ON = 1
const BCI_BRIGHTNESS_OFF = 0.3
const BCI_FREQUENCY_UPDATE_MS = 3000

type BciLetterKey = 'b' | 'c' | 'i'

type BciLetterState = {
    intervalMs: number
    isDimmed: boolean
    letterNode: HTMLSpanElement
    timeoutId: number | null
}

const BCI_INTERVAL_BY_LETTER_MS: Record<BciLetterKey, { min: number; max: number }> = {
    b: { min: 700, max: 1000 },
    c: { min: 700, max: 1000 },
    i: { min: 700, max: 1000 },
}

const getIntervalRangeByLetter = (letterNode: HTMLSpanElement) => {
    const letter = letterNode.dataset.letter
    if (letter === 'b' || letter === 'c' || letter === 'i') {
        return BCI_INTERVAL_BY_LETTER_MS[letter]
    }
    return { min: 700, max: 1000 }
}

const getRandomIntervalMs = (minIntervalMs: number, maxIntervalMs: number) => {
    const intervalRange = maxIntervalMs - minIntervalMs + 1
    return minIntervalMs + Math.floor(Math.random() * intervalRange)
}

const setLetterBrightness = (letterNode: HTMLSpanElement, brightness: number) => {
    letterNode.style.filter = `brightness(${brightness})`
}

export const initBciFrequencyBlink = () => {
    const bciKeywordNode = queryOptional<HTMLElement>(BCI_KEYWORD_SELECTOR)
    const bciWordNode = bciKeywordNode?.querySelector<HTMLElement>(BCI_WORD_SELECTOR)
    if (!bciKeywordNode || !bciWordNode) return

    const letterNodes = Array.from(
        bciWordNode.querySelectorAll<HTMLSpanElement>(BCI_LETTER_SELECTOR)
    )
    if (letterNodes.length === 0) return

    const letterStates: BciLetterState[] = letterNodes.map((letterNode) => ({
        intervalMs: getRandomIntervalMs(
            getIntervalRangeByLetter(letterNode).min,
            getIntervalRangeByLetter(letterNode).max
        ),
        isDimmed: false,
        letterNode,
        timeoutId: null,
    }))

    let isRunning = false
    let isHovered = false
    let isFocused = false
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
            const { min, max } = getIntervalRangeByLetter(letterState.letterNode)
            letterState.intervalMs = getRandomIntervalMs(min, max)
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

    const syncAnimation = () => {
        if (document.visibilityState === 'hidden') {
            stopAnimation()
            return
        }

        if (isHovered || isFocused) {
            startAnimation()
            return
        }

        stopAnimation()
    }

    bciKeywordNode.addEventListener('mouseenter', () => {
        isHovered = true
        syncAnimation()
    })

    bciKeywordNode.addEventListener('mouseleave', () => {
        isHovered = false
        syncAnimation()
    })

    bciKeywordNode.addEventListener('focusin', () => {
        isFocused = true
        syncAnimation()
    })

    bciKeywordNode.addEventListener('focusout', (event: FocusEvent) => {
        const nextFocusNode = event.relatedTarget
        if (nextFocusNode instanceof Node && bciKeywordNode.contains(nextFocusNode)) return
        isFocused = false
        syncAnimation()
    })

    document.addEventListener('visibilitychange', syncAnimation)

    applyBaseState()
    syncAnimation()
}
