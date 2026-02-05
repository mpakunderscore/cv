import './styles/index.css'
import './who'

const getEl = (selector: string): HTMLElement => {
    const element = document.querySelector<HTMLElement>(selector)
    if (!element) {
        throw new Error(`Missing element: ${selector}`)
    }
    return element
}

const openCv = () => {
    getEl('.about').style.display = 'none'
    getEl('.cv').style.display = 'block'
}

const emoji = {
    light: '🌞',
    dark: '🌚',
} as const

const setTheme = (theme?: 'light' | 'dark') => {
    if (document.documentElement.className === 'dark') {
        theme = 'light'
    } else {
        theme = 'dark'
    }
    document.documentElement.className = theme
    getEl('.color-scheme').innerText = emoji[theme]
}

let postfix = ''
let counter = -5
const name = '.space'

const typesetting = () => {
    if (counter > 0) {
        postfix = name.slice(0, counter) + '_'

        if (counter > 5) {
            counter = -5
        }
    } else {
        if (postfix === '') {
            postfix = '_'
        } else {
            postfix = ''
        }
    }

    getEl('.typesetting-last').innerText = postfix

    counter++
}

typesetting()
setInterval(typesetting, 500)

declare global {
    interface Window {
        cv: () => void
        setTheme: (theme?: 'light' | 'dark') => void
    }
}

window.cv = openCv
window.setTheme = setTheme
