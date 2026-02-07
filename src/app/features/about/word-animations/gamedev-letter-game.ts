import { queryOptional } from '@/lib/dom'

const GAMEDEV_KEYWORD_SELECTOR = '.about-keyword-item-gamedev'
const DEBUG_BUILD_SELECTOR = '[data-role="debug-build"]'
const DEBUG_GAME_ROLE = 'debug-gamedev-letter-game'
const LETTER_TARGET_CLASS = 'about-letter-game-target'
const KEYWORD_ACTIVE_CLASS = 'is-active'
const GAME_TICK_MS = 1000
const LETTER_PATTERN = /\p{L}/u

type LetterCandidate = {
    textNode: Text
    letterIndexes: number[]
}

const pickRandom = <T>(values: T[]): T | null => {
    if (values.length === 0) return null

    const randomIndex = Math.floor(Math.random() * values.length)
    return values[randomIndex]
}

const collectLetterIndexes = (value: string) => {
    const indexes: number[] = []

    for (let index = 0; index < value.length; index += 1) {
        if (LETTER_PATTERN.test(value[index])) {
            indexes.push(index)
        }
    }

    return indexes
}

const isNodeVisible = (startNode: HTMLElement) => {
    let currentNode: HTMLElement | null = startNode

    while (currentNode) {
        const computedStyle = window.getComputedStyle(currentNode)
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            return false
        }

        currentNode = currentNode.parentElement
    }

    return true
}

const createLetterCandidates = (): LetterCandidate[] => {
    if (!document.body) return []

    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (currentNode) => {
            if (!(currentNode instanceof Text)) return NodeFilter.FILTER_REJECT

            const parentNode = currentNode.parentElement
            if (!parentNode) return NodeFilter.FILTER_REJECT

            const parentTagName = parentNode.tagName
            if (
                parentTagName === 'SCRIPT' ||
                parentTagName === 'STYLE' ||
                parentTagName === 'NOSCRIPT'
            ) {
                return NodeFilter.FILTER_REJECT
            }
            if (!isNodeVisible(parentNode)) return NodeFilter.FILTER_REJECT
            if (parentNode.closest('[data-role="debug"]')) return NodeFilter.FILTER_REJECT
            if (parentNode.closest(`.${LETTER_TARGET_CLASS}`)) return NodeFilter.FILTER_REJECT

            const nodeValue = currentNode.nodeValue ?? ''
            if (!LETTER_PATTERN.test(nodeValue)) return NodeFilter.FILTER_REJECT

            return NodeFilter.FILTER_ACCEPT
        },
    })

    const candidates: LetterCandidate[] = []
    let currentNode = textWalker.nextNode()

    while (currentNode) {
        if (currentNode instanceof Text) {
            const nodeValue = currentNode.nodeValue ?? ''
            const letterIndexes = collectLetterIndexes(nodeValue)
            if (letterIndexes.length > 0) {
                candidates.push({ textNode: currentNode, letterIndexes })
            }
        }

        currentNode = textWalker.nextNode()
    }

    return candidates
}

const getLetterRect = (textNode: Text, letterIndex: number) => {
    const nodeValue = textNode.nodeValue ?? ''
    const targetLetter = nodeValue[letterIndex]
    if (!targetLetter || !LETTER_PATTERN.test(targetLetter)) return null

    const letterRange = document.createRange()
    letterRange.setStart(textNode, letterIndex)
    letterRange.setEnd(textNode, letterIndex + 1)

    const letterRect = letterRange.getBoundingClientRect()
    if (letterRect.width <= 0 || letterRect.height <= 0) return null

    return letterRect
}

const createTargetNode = (letterRect: DOMRect) => {
    const targetNode = document.createElement('button')
    targetNode.type = 'button'
    targetNode.className = LETTER_TARGET_CLASS
    targetNode.setAttribute('aria-label', 'Catch letter')
    targetNode.style.left = `${letterRect.left + letterRect.width / 2}px`
    targetNode.style.top = `${letterRect.top + letterRect.height / 2}px`
    document.body.appendChild(targetNode)

    return targetNode
}

export const initGamedevLetterGame = () => {
    const gamedevKeywordNode = queryOptional<HTMLElement>(GAMEDEV_KEYWORD_SELECTOR)
    const debugBuildNode = queryOptional<HTMLElement>(DEBUG_BUILD_SELECTOR)
    if (!gamedevKeywordNode || !debugBuildNode) return

    let timerId: number | null = null
    let score = 0
    let activeTargetNode: HTMLButtonElement | null = null
    let debugGameNode: HTMLDivElement | null = null
    let debugScoreNode: HTMLDivElement | null = null

    const updateDebugScore = () => {
        if (!debugScoreNode) return
        debugScoreNode.innerText = `Score: ${score}`
    }

    const mountDebugGame = () => {
        if (debugGameNode) return

        debugGameNode = document.createElement('div')
        debugGameNode.setAttribute('data-role', DEBUG_GAME_ROLE)

        debugScoreNode = document.createElement('div')
        debugScoreNode.className = 'debug-gamedev-score'
        updateDebugScore()

        const debugHintNode = document.createElement('div')
        debugHintNode.className = 'debug-gamedev-hint'
        debugHintNode.innerText = 'Click the highlighted area.'

        debugGameNode.append(debugScoreNode, debugHintNode)
        debugBuildNode.appendChild(debugGameNode)
    }

    const unmountDebugGame = () => {
        debugGameNode?.remove()
        debugGameNode = null
        debugScoreNode = null
    }

    const clearActiveTarget = () => {
        if (!activeTargetNode) return
        activeTargetNode.remove()
        activeTargetNode = null
    }

    const awardPoint = (clickedNode: HTMLButtonElement) => {
        if (activeTargetNode !== clickedNode) return

        score += 1
        updateDebugScore()
        endGame()
    }

    const activateRandomLetter = () => {
        clearActiveTarget()

        const candidate = pickRandom(createLetterCandidates())
        if (!candidate) return

        const letterIndex = pickRandom(candidate.letterIndexes)
        if (letterIndex === null) return

        const letterRect = getLetterRect(candidate.textNode, letterIndex)
        if (!letterRect) return

        const targetNode = createTargetNode(letterRect)
        activeTargetNode = targetNode
        const claimPoint = () => awardPoint(targetNode)

        targetNode.addEventListener('click', claimPoint, { once: true })
    }

    const startGame = () => {
        if (timerId !== null) return

        mountDebugGame()
        updateDebugScore()
        activateRandomLetter()
        gamedevKeywordNode.classList.add(KEYWORD_ACTIVE_CLASS)
        timerId = window.setInterval(activateRandomLetter, GAME_TICK_MS)
    }

    const endGame = () => {
        if (timerId !== null) {
            window.clearInterval(timerId)
            timerId = null
        }

        clearActiveTarget()
        gamedevKeywordNode.classList.remove(KEYWORD_ACTIVE_CLASS)
    }

    gamedevKeywordNode.addEventListener('mouseenter', () => {
        startGame()
    })

    gamedevKeywordNode.addEventListener('focusin', () => {
        startGame()
    })

    gamedevKeywordNode.addEventListener('click', () => {
        endGame()
    })

    gamedevKeywordNode.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        endGame()
    })
}
