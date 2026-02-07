import { queryOptional } from '@/lib/dom'

const ROBOTICS_KEYWORD_SELECTOR = '.about-keyword-item-robotics'
const ROBOTICS_WORD_SELECTOR = '.about-robotics-word'
const ROBOTICS_BASE_WORD = 'Robotics'
const ROBOTICS_STEP_MS = 300
const ROBOTICS_GROUP_STEPS = 3
const ROBOTICS_TICS_STEPS = 6
const ROBOTICS_LEFT_GROUP = 'Robo'
const ROBOTICS_RIGHT_GROUP = 'tics'

type RoboticsPhase = 'tics' | 'group'

const getTicsLetterOffsets = (ticsStep: number): [number, number, number] => {
    if (ticsStep <= 0) return [0, 0, 0]
    if (ticsStep <= ROBOTICS_GROUP_STEPS) return [0, 0, ticsStep]

    const shiftToLeft = Math.min(ROBOTICS_GROUP_STEPS, ticsStep - ROBOTICS_GROUP_STEPS)
    return [0, shiftToLeft, ROBOTICS_GROUP_STEPS - shiftToLeft]
}

const buildRoboticsWord = (
    groupOffset: number,
    interGroupGap: number,
    letterOffsets: [number, number, number]
) => {
    const [offsetTi, offsetIc, offsetCs] = letterOffsets
    return `${' '.repeat(groupOffset)}${ROBOTICS_LEFT_GROUP}${' '.repeat(interGroupGap)}t${' '.repeat(offsetTi)}i${' '.repeat(offsetIc)}c${' '.repeat(offsetCs)}s`
}

export const initRoboticsSpacingAnimation = () => {
    const roboticsKeyword = queryOptional<HTMLElement>(ROBOTICS_KEYWORD_SELECTOR)
    const roboticsWordNode = roboticsKeyword?.querySelector<HTMLElement>(ROBOTICS_WORD_SELECTOR)
    if (!roboticsKeyword || !roboticsWordNode) return

    let currentPhase: RoboticsPhase = 'tics'
    let phaseStep = 0
    let groupOffset = 0
    let interGroupGap = 0
    let ticsStep = 0
    let timerId: number | null = null
    let isHovered = false
    let isFocused = false

    const renderWord = () => {
        roboticsWordNode.innerText = buildRoboticsWord(
            groupOffset,
            interGroupGap,
            getTicsLetterOffsets(ticsStep)
        )
    }

    const applyBaseWord = () => {
        currentPhase = 'tics'
        phaseStep = 0
        groupOffset = 0
        interGroupGap = 0
        ticsStep = 0
        roboticsWordNode.innerText = ROBOTICS_BASE_WORD
    }

    const applyPhaseStep = () => {
        if (currentPhase === 'tics') {
            phaseStep += 1
            ticsStep = Math.min(ROBOTICS_TICS_STEPS, ticsStep + 1)

            if (phaseStep <= ROBOTICS_GROUP_STEPS) {
                interGroupGap += 1
            }

            renderWord()

            if (phaseStep >= ROBOTICS_TICS_STEPS) {
                currentPhase = 'group'
                phaseStep = 0
            }
        } else {
            groupOffset += 1
            interGroupGap = Math.max(0, interGroupGap - 1)
            phaseStep += 1

            renderWord()

            if (phaseStep >= ROBOTICS_GROUP_STEPS) {
                currentPhase = 'tics'
                phaseStep = 0
                ticsStep = 0
            }
        }
    }

    const startAnimation = () => {
        if (timerId !== null) return
        applyPhaseStep()
        timerId = window.setInterval(applyPhaseStep, ROBOTICS_STEP_MS)
    }

    const stopAnimation = () => {
        if (timerId === null) return
        window.clearInterval(timerId)
        timerId = null
        applyBaseWord()
    }

    const syncAnimation = () => {
        if (isHovered || isFocused) {
            startAnimation()
            return
        }
        stopAnimation()
    }

    roboticsKeyword.addEventListener('mouseenter', () => {
        isHovered = true
        syncAnimation()
    })

    roboticsKeyword.addEventListener('mouseleave', () => {
        isHovered = false
        syncAnimation()
    })

    roboticsKeyword.addEventListener('focusin', () => {
        isFocused = true
        syncAnimation()
    })

    roboticsKeyword.addEventListener('focusout', (event: FocusEvent) => {
        const nextFocusNode = event.relatedTarget
        if (nextFocusNode instanceof Node && roboticsKeyword.contains(nextFocusNode)) return
        isFocused = false
        syncAnimation()
    })

    applyBaseWord()
}
