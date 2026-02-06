export const CONFIG = {
    selectors: {
        about: '.about-screen',
        blog: '.blog-screen',
        cv: '.cv-screen',
        aboutCvTile: '.about-screen-tile-cv',
        aboutBlogTile: '.about-screen-tile-blog',
        colorScheme: '[data-role="color-scheme"]',
        typesettingLast: '[data-role="typesetting-last"]',
        counter: '[data-role="counter"]',
        debug: '[data-role="debug"]',
        debugBuild: '[data-role="debug-build"]',
    },
    classes: {
        hidden: 'is-hidden',
        visible: 'is-visible',
    },
    timings: {
        typesettingMs: 500,
    },
} as const

export const UI_TEXT = {
    emoji: {
        light: '🌞',
        dark: '🌚',
    },
    typesettingName: '.space',
} as const
