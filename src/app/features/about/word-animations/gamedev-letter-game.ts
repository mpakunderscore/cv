import { queryOptional } from '@/lib/dom'

const GAMEDEV_KEYWORD_SELECTOR = '.about-keyword-item-gamedev'
const ABOUT_CTA_TILE_SELECTOR = '.about-screen-tile-cta'
const DEBUG_BUILD_SELECTOR = '[data-role="debug-build"]'
const DEBUG_GAME_ROLE = 'debug-gamedev-letter-game'
const LETTER_TARGET_CLASS = 'about-letter-game-letter'
const KEYWORD_ACTIVE_CLASS = 'is-active'
const GAME_TICK_MS = 1000
const ABOUT_LINES_COUNT = 2
const LETTER_PATTERN = /\p{L}/u

type LetterCandidate = {
    textNode: Text
    letterIndexes: number[]
}

type LetterTarget = {
    letterNode: HTMLSpanElement
    clear: () => void
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

const createLetterCandidates = (scopeNodes: HTMLElement[]): LetterCandidate[] => {
    const candidates: LetterCandidate[] = []

    for (const scopeNode of scopeNodes) {
        const textWalker = document.createTreeWalker(scopeNode, NodeFilter.SHOW_TEXT, {
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
    }

    return candidates
}

const createLetterTarget = (textNode: Text, letterIndex: number): LetterTarget | null => {
    const nodeValue = textNode.nodeValue ?? ''
    const targetLetter = nodeValue[letterIndex]
    if (!targetLetter || !LETTER_PATTERN.test(targetLetter)) return null

    const highlightedLetterNode = textNode.splitText(letterIndex)
    highlightedLetterNode.splitText(1)

    const parentNode = highlightedLetterNode.parentNode
    if (!parentNode) return null

    const letterNode = document.createElement('span')
    letterNode.className = LETTER_TARGET_CLASS
    letterNode.innerText = highlightedLetterNode.nodeValue ?? targetLetter
    letterNode.setAttribute('role', 'button')
    letterNode.setAttribute('tabindex', '0')
    letterNode.setAttribute('aria-label', 'Catch highlighted letter')
    parentNode.replaceChild(letterNode, highlightedLetterNode)

    const clear = () => {
        const replacementNode = document.createTextNode(letterNode.innerText)
        letterNode.replaceWith(replacementNode)
        replacementNode.parentElement?.normalize()
    }

    return { letterNode, clear }
}

export const initGamedevLetterGame = () => {
    const gamedevKeywordNode = queryOptional<HTMLElement>(GAMEDEV_KEYWORD_SELECTOR)
    const aboutCtaTileNode = queryOptional<HTMLElement>(ABOUT_CTA_TILE_SELECTOR)
    const debugBuildNode = queryOptional<HTMLElement>(DEBUG_BUILD_SELECTOR)
    if (!gamedevKeywordNode || !aboutCtaTileNode || !debugBuildNode) return

    const gameLineNodes = Array.from(aboutCtaTileNode.querySelectorAll<HTMLElement>(':scope > div')).slice(
        0,
        ABOUT_LINES_COUNT
    )
    if (gameLineNodes.length === 0) return

    let timerId: number | null = null
    let score = 0
    let activeTarget: LetterTarget | null = null
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
        debugHintNode.innerText = 'Click the highlighted letter.'

        debugGameNode.append(debugScoreNode, debugHintNode)
        debugBuildNode.appendChild(debugGameNode)
    }

    const unmountDebugGame = () => {
        debugGameNode?.remove()
        debugGameNode = null
        debugScoreNode = null
    }

    const clearActiveTarget = () => {
        if (!activeTarget) return
        activeTarget.clear()
        activeTarget = null
    }

    const awardPoint = (clickedNode: HTMLSpanElement) => {
        if (!activeTarget || activeTarget.letterNode !== clickedNode) return

        score += 1
        updateDebugScore()
        endGame()
    }

    const activateRandomLetter = () => {
        clearActiveTarget()

        const candidate = pickRandom(createLetterCandidates(gameLineNodes))
        if (!candidate) return

        const letterIndex = pickRandom(candidate.letterIndexes)
        if (letterIndex === null) return

        const target = createLetterTarget(candidate.textNode, letterIndex)
        if (!target) return

        activeTarget = target
        const claimPoint = () => awardPoint(target.letterNode)
        const onTargetKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            claimPoint()
        }

        target.letterNode.addEventListener('click', claimPoint, { once: true })
        target.letterNode.addEventListener('keydown', onTargetKeyDown)
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

    const toggleGame = () => {
        if (timerId !== null) {
            endGame()
            return
        }

        startGame()
    }

    gamedevKeywordNode.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault()
        toggleGame()
    })

    gamedevKeywordNode.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggleGame()
    })
}
