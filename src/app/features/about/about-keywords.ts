import { queryOptional } from '@/lib/dom'

const TOPIC_COPY = {
    gamedev: 'I build games as systems: from feel and mechanics to tools and shipping loops.',
    web: 'I design web apps that stay fast, clear, and reliable under real user load.',
    ai: 'I use AI where it creates leverage: prototyping faster and automating repetitive thinking.',
    bci: 'I explore BCI through signal quality, interaction design, and practical neurotech constraints.',
    robotics: 'I like robotics where software meets hardware and precise motion turns into useful behavior.',
} as const

type TopicKey = keyof typeof TOPIC_COPY

const isTopicKey = (value: string): value is TopicKey => value in TOPIC_COPY

export const initAboutKeywords = () => {
    const keywordLine = queryOptional<HTMLElement>('[data-role="about-keywords"]')
    const keywordCopyNode = queryOptional<HTMLElement>('[data-role="about-keyword-copy"]')
    if (!keywordLine || !keywordCopyNode) return

    const keywordItems = keywordLine.querySelectorAll<HTMLElement>('[data-topic]')
    if (keywordItems.length === 0) return

    const applyTopic = (topic: TopicKey) => {
        keywordCopyNode.innerText = TOPIC_COPY[topic]

        keywordItems.forEach((keywordItem) => {
            const isActive = keywordItem.dataset.topic === topic
            keywordItem.classList.toggle('is-active', isActive)
        })
    }

    keywordItems.forEach((keywordItem) => {
        const onTopicPick = () => {
            const topic = keywordItem.dataset.topic
            if (!topic || !isTopicKey(topic)) return
            applyTopic(topic)
        }

        keywordItem.addEventListener('click', onTopicPick)
        keywordItem.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            onTopicPick()
        })
    })
}
