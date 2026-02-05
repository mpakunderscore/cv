export const queryOptional = <T extends HTMLElement>(selector: string): T | null =>
    document.querySelector<T>(selector)

export const onClick = (element: HTMLElement | null, handler: () => void) => {
    if (!element) return
    element.addEventListener('click', handler)
}

export const addClass = (element: HTMLElement | null, className: string) => {
    if (!element) return
    element.classList.add(className)
}

export const removeClass = (element: HTMLElement | null, className: string) => {
    if (!element) return
    element.classList.remove(className)
}
