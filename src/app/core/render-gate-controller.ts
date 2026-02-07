const RENDER_LOCK_CLASS = 'app-loading'
const DEFAULT_REVEAL_TIMEOUT_MS = 3000

const waitForDomReady = async () => {
    if (document.readyState !== 'loading') return

    await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
    })
}

const waitForWindowLoad = async () => {
    if (document.readyState === 'complete') return

    await new Promise<void>((resolve) => {
        window.addEventListener('load', () => resolve(), { once: true })
    })
}

const waitForFonts = async () => {
    if (!document.fonts?.ready) return

    try {
        await document.fonts.ready
    } catch {
        // Ignore font loading errors and continue with timeout fallback.
    }
}

const waitForTimeout = async (timeoutMs: number) => {
    await new Promise<void>((resolve) => {
        window.setTimeout(resolve, timeoutMs)
    })
}

export const createRenderGateController = (revealTimeoutMs = DEFAULT_REVEAL_TIMEOUT_MS) => {
    let isRevealed = false

    const reveal = () => {
        if (isRevealed) return

        document.documentElement.classList.remove(RENDER_LOCK_CLASS)
        isRevealed = true
    }

    const waitForReadyAndReveal = async () => {
        await waitForDomReady()

        await Promise.race([
            Promise.all([waitForWindowLoad(), waitForFonts()]),
            waitForTimeout(revealTimeoutMs),
        ])

        reveal()
    }

    return {
        reveal,
        waitForReadyAndReveal,
    }
}
