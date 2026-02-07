export type ProbeEntry = {
    key: string
    value: string
}

const stringifyValue = (value: unknown) => {
    if (value === null || value === undefined) return 'n/a'
    if (typeof value === 'string' && value.trim() === '') return 'n/a'
    return String(value)
}

const readPreference = (query: string) => {
    if (!window.matchMedia) return 'n/a'
    return window.matchMedia(query).matches ? 'yes' : 'no'
}

const readStorageStatus = (storageName: 'localStorage' | 'sessionStorage') => {
    try {
        const storageNode = window[storageName]
        if (!storageNode) return 'n/a'
        return 'available'
    } catch {
        return 'blocked'
    }
}

type NavigatorExtras = Navigator & {
    connection?: {
        effectiveType?: string
        downlink?: number
        rtt?: number
        saveData?: boolean
    }
    deviceMemory?: number
    pdfViewerEnabled?: boolean
}

type UserAgentSegments = {
    browser: string
    browserVersion: string
    engine: string
    operatingSystem: string
    deviceType: string
}

const detectBrowserInfo = (userAgentText: string): { browser: string; browserVersion: string } => {
    const browserMatchers = [
        { browser: 'Edge', pattern: /Edg\/([\d.]+)/ },
        { browser: 'Opera', pattern: /OPR\/([\d.]+)/ },
        { browser: 'Samsung Internet', pattern: /SamsungBrowser\/([\d.]+)/ },
        { browser: 'Chrome', pattern: /(?:Chrome|CriOS)\/([\d.]+)/ },
        { browser: 'Firefox', pattern: /Firefox\/([\d.]+)/ },
        { browser: 'Safari', pattern: /Version\/([\d.]+).*Safari/ },
        { browser: 'Internet Explorer', pattern: /(?:MSIE |rv:)([\d.]+)/ },
    ] as const

    for (const matcher of browserMatchers) {
        const versionMatch = userAgentText.match(matcher.pattern)
        if (!versionMatch) continue
        return {
            browser: matcher.browser,
            browserVersion: versionMatch[1] || 'n/a',
        }
    }

    return {
        browser: 'Unknown',
        browserVersion: 'n/a',
    }
}

const detectEngineInfo = (userAgentText: string): string => {
    if (/Trident\/|MSIE/.test(userAgentText)) return 'Trident'
    if (/Gecko\/\d+/.test(userAgentText) && /Firefox\/\d/.test(userAgentText)) return 'Gecko'
    if (/(?:Chrome|CriOS|Edg|OPR)\/\d/.test(userAgentText)) return 'Blink'
    if (/AppleWebKit\/\d/.test(userAgentText)) return 'WebKit'
    return 'Unknown'
}

const detectOperatingSystemInfo = (userAgentText: string): string => {
    if (/Windows NT 10\.0/.test(userAgentText)) return 'Windows 10/11'
    if (/Windows NT 6\.3/.test(userAgentText)) return 'Windows 8.1'
    if (/Windows NT 6\.2/.test(userAgentText)) return 'Windows 8'
    if (/Windows NT 6\.1/.test(userAgentText)) return 'Windows 7'

    const androidMatch = userAgentText.match(/Android ([\d.]+)/)
    if (androidMatch) return `Android ${androidMatch[1]}`

    const iPhoneMatch = userAgentText.match(/iPhone OS ([\d_]+)/)
    if (iPhoneMatch) return `iOS ${iPhoneMatch[1]?.split('_').join('.')}`

    const iPadMatch = userAgentText.match(/(?:iPad|CPU OS) ([\d_]+)/)
    if (iPadMatch) return `iPadOS ${iPadMatch[1]?.split('_').join('.')}`

    const macOsMatch = userAgentText.match(/Mac OS X ([\d_]+)/)
    if (macOsMatch) return `macOS ${macOsMatch[1]?.split('_').join('.')}`

    if (/CrOS/.test(userAgentText)) return 'Chrome OS'
    if (/Linux/.test(userAgentText)) return 'Linux'
    return 'Unknown'
}

const detectDeviceType = (userAgentText: string): string => {
    if (/bot|crawler|spider|headless/i.test(userAgentText)) return 'bot'
    if (/Tablet|iPad/i.test(userAgentText)) return 'tablet'
    if (/Mobi|Android|iPhone|iPod/i.test(userAgentText)) return 'mobile'
    if (/SmartTV|TV/i.test(userAgentText)) return 'tv'
    return 'desktop'
}

const parseUserAgentSegments = (userAgentText: string): UserAgentSegments => {
    const browserInfo = detectBrowserInfo(userAgentText)

    return {
        browser: browserInfo.browser,
        browserVersion: browserInfo.browserVersion,
        engine: detectEngineInfo(userAgentText),
        operatingSystem: detectOperatingSystemInfo(userAgentText),
        deviceType: detectDeviceType(userAgentText),
    }
}

export const createWebProbeEntries = (): ProbeEntry[] => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const userLanguage = navigator.language
    const userLanguages = navigator.languages?.join(', ')
    const userAgentText = navigator.userAgent
    const userAgentSegments = parseUserAgentSegments(userAgentText)
    const currentNavigator = navigator as NavigatorExtras
    const connectionInfo = currentNavigator.connection

    return [
        { key: 'userAgentRaw', value: stringifyValue(userAgentText) },
        { key: 'userAgentBrowser', value: stringifyValue(userAgentSegments.browser) },
        { key: 'userAgentBrowserVersion', value: stringifyValue(userAgentSegments.browserVersion) },
        { key: 'userAgentEngine', value: stringifyValue(userAgentSegments.engine) },
        { key: 'userAgentOS', value: stringifyValue(userAgentSegments.operatingSystem) },
        { key: 'userAgentDevice', value: stringifyValue(userAgentSegments.deviceType) },
        { key: 'platform', value: stringifyValue(navigator.platform) },
        { key: 'language', value: stringifyValue(userLanguage) },
        { key: 'languages', value: stringifyValue(userLanguages) },
        { key: 'timeZone', value: stringifyValue(userTimeZone) },
        { key: 'cookieEnabled', value: stringifyValue(navigator.cookieEnabled) },
        { key: 'online', value: stringifyValue(navigator.onLine) },
        { key: 'hardwareConcurrency', value: stringifyValue(navigator.hardwareConcurrency) },
        { key: 'deviceMemoryGB', value: stringifyValue(currentNavigator.deviceMemory) },
        { key: 'maxTouchPoints', value: stringifyValue(navigator.maxTouchPoints) },
        { key: 'screen', value: `${window.screen.width}x${window.screen.height}` },
        { key: 'viewport', value: `${window.innerWidth}x${window.innerHeight}` },
        { key: 'prefersDark', value: readPreference('(prefers-color-scheme: dark)') },
        { key: 'prefersReducedMotion', value: readPreference('(prefers-reduced-motion: reduce)') },
        { key: 'vendor', value: stringifyValue(navigator.vendor) },
        { key: 'productSub', value: stringifyValue(navigator.productSub) },
        { key: 'webdriver', value: stringifyValue(navigator.webdriver) },
        { key: 'doNotTrack', value: stringifyValue(navigator.doNotTrack) },
        { key: 'pdfViewerEnabled', value: stringifyValue(currentNavigator.pdfViewerEnabled) },
        { key: 'colorDepth', value: stringifyValue(window.screen.colorDepth) },
        { key: 'pixelDepth', value: stringifyValue(window.screen.pixelDepth) },
        { key: 'devicePixelRatio', value: stringifyValue(window.devicePixelRatio) },
        { key: 'orientation', value: stringifyValue(window.screen.orientation?.type) },
        { key: 'historyLength', value: stringifyValue(window.history.length) },
        { key: 'referrer', value: stringifyValue(document.referrer) },
        { key: 'protocol', value: stringifyValue(window.location.protocol) },
        { key: 'localStorage', value: readStorageStatus('localStorage') },
        { key: 'sessionStorage', value: readStorageStatus('sessionStorage') },
        { key: 'appName', value: stringifyValue(navigator.appName) },
        { key: 'appCodeName', value: stringifyValue(navigator.appCodeName) },
        { key: 'appVersion', value: stringifyValue(navigator.appVersion) },
        { key: 'product', value: stringifyValue(navigator.product) },
        { key: 'vendorSub', value: stringifyValue(navigator.vendorSub) },
        { key: 'languageCount', value: stringifyValue(navigator.languages?.length) },
        { key: 'screenAvail', value: `${window.screen.availWidth}x${window.screen.availHeight}` },
        { key: 'timeZoneOffset', value: stringifyValue(new Date().getTimezoneOffset()) },
        { key: 'documentCharset', value: stringifyValue(document.characterSet) },
        { key: 'documentReadyState', value: stringifyValue(document.readyState) },
        { key: 'visibilityState', value: stringifyValue(document.visibilityState) },
        { key: 'touchApi', value: 'ontouchstart' in window ? 'yes' : 'no' },
        { key: 'prefersContrast', value: readPreference('(prefers-contrast: more)') },
        { key: 'prefersDataReduced', value: readPreference('(prefers-reduced-data: reduce)') },
        { key: 'pointerCoarse', value: readPreference('(pointer: coarse)') },
        { key: 'pointerFine', value: readPreference('(pointer: fine)') },
        { key: 'networkType', value: stringifyValue(connectionInfo?.effectiveType) },
        { key: 'networkDownlinkMbps', value: stringifyValue(connectionInfo?.downlink) },
        { key: 'networkRttMs', value: stringifyValue(connectionInfo?.rtt) },
        { key: 'networkSaveData', value: stringifyValue(connectionInfo?.saveData) },
    ]
}
