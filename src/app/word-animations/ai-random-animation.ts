import { queryOptional } from '@/lib/dom'

const AI_KEYWORD_SELECTOR = '.about-keyword-item-ai'
const AI_WORD_SELECTOR = '.about-ai-word'
const AI_BASE_WORD = 'AI'
const AI_HOLD_MS = 300
const AI_SCRAMBLE_MS = 600
const AI_SCRAMBLE_TICK_MS = 50
const AI_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const getRandomLetter = (excludeLetter?: string) => {
    let letter = ''

    while (letter === '' || letter === excludeLetter) {
        const randomIndex = Math.floor(Math.random() * AI_ALPHABET.length)
        letter = AI_ALPHABET[randomIndex]
    }

    return letter
}

export const initAiRandomAnimation = () => {
    const aiKeywordNode = queryOptional<HTMLElement>(AI_KEYWORD_SELECTOR)
    const aiWordNode = aiKeywordNode?.querySelector<HTMLElement>(AI_WORD_SELECTOR)
    if (!aiKeywordNode || !aiWordNode) return

    let fixedLetters: [string, string] = ['A', 'I']
    let activeLetterIndex = 0
    let isHovered = false
    let isFocused = false
    let isRunning = false
    let sessionId = 0
    let holdTimeoutId: number | null = null
    let scrambleTimeoutId: number | null = null
    let scrambleIntervalId: number | null = null

    const renderFixedWord = () => {
        aiWordNode.innerText = fixedLetters.join('')
    }

    const renderScrambleWord = (letter: string) => {
        const draftLetters = [...fixedLetters] as [string, string]
        draftLetters[activeLetterIndex] = letter
        aiWordNode.innerText = draftLetters.join('')
    }

    const clearAnimationTimers = () => {
        if (holdTimeoutId !== null) {
            window.clearTimeout(holdTimeoutId)
            holdTimeoutId = null
        }
        if (scrambleTimeoutId !== null) {
            window.clearTimeout(scrambleTimeoutId)
            scrambleTimeoutId = null
        }
        if (scrambleIntervalId !== null) {
            window.clearInterval(scrambleIntervalId)
            scrambleIntervalId = null
        }
    }

    const resetWord = () => {
        fixedLetters = ['A', 'I']
        activeLetterIndex = 0
        renderFixedWord()
    }

    const runCycle = (cycleSessionId: number) => {
        if (cycleSessionId !== sessionId) return

        renderFixedWord()
        holdTimeoutId = window.setTimeout(() => {
            if (cycleSessionId !== sessionId) return

            const nextLetter = getRandomLetter(fixedLetters[activeLetterIndex])

            scrambleIntervalId = window.setInterval(() => {
                if (cycleSessionId !== sessionId) return
                renderScrambleWord(getRandomLetter())
            }, AI_SCRAMBLE_TICK_MS)

            scrambleTimeoutId = window.setTimeout(() => {
                if (scrambleIntervalId !== null) {
                    window.clearInterval(scrambleIntervalId)
                    scrambleIntervalId = null
                }
                if (cycleSessionId !== sessionId) return

                fixedLetters[activeLetterIndex] = nextLetter
                activeLetterIndex = activeLetterIndex === 0 ? 1 : 0
                runCycle(cycleSessionId)
            }, AI_SCRAMBLE_MS)
        }, AI_HOLD_MS)
    }

    const startAnimation = () => {
        if (isRunning) return
        isRunning = true
        sessionId += 1
        clearAnimationTimers()
        runCycle(sessionId)
    }

    const stopAnimation = () => {
        if (!isRunning) return
        isRunning = false
        sessionId += 1
        clearAnimationTimers()
        resetWord()
    }

    const syncAnimation = () => {
        if (isHovered || isFocused) {
            startAnimation()
            return
        }
        stopAnimation()
    }

    aiKeywordNode.addEventListener('mouseenter', () => {
        isHovered = true
        syncAnimation()
    })

    aiKeywordNode.addEventListener('mouseleave', () => {
        isHovered = false
        syncAnimation()
    })

    aiKeywordNode.addEventListener('focusin', () => {
        isFocused = true
        syncAnimation()
    })

    aiKeywordNode.addEventListener('focusout', (event: FocusEvent) => {
        const nextFocusNode = event.relatedTarget
        if (nextFocusNode instanceof Node && aiKeywordNode.contains(nextFocusNode)) return
        isFocused = false
        syncAnimation()
    })

    resetWord()
}
