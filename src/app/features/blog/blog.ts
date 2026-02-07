import type { BlogGenerateResponse } from '@/app/api/blog-api'
import { createBlogGenerateController } from '@/app/features/blog/blog-generate-controller'
import { createBlogGeneratedPostsStorageController } from '@/app/features/blog/blog-generated-posts-storage-controller'
import { BLOG_POSTS, type BlogPost } from '@/app/features/blog/blog-posts'
import { CONFIG } from '@/lib/config'
import { queryOptional } from '@/lib/dom'

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()

const TOP_POST_INDEX = 0
const TOP_POST_ORIGINAL_TITLE = BLOG_POSTS[TOP_POST_INDEX]?.title ?? ''
const TOP_POST_ORIGINAL_PARAGRAPHS = [...(BLOG_POSTS[TOP_POST_INDEX]?.paragraphs ?? [])]
const TOP_POST_ORIGINAL_BODY = TOP_POST_ORIGINAL_PARAGRAPHS.join(' ')
const RUN_RESET_TIMEOUT_MS = 2000
const RUN_BUTTON_TEXT = 'GENERATE'
const generatedBlogPosts: BlogPost[] = []
const generatedPostsStorageController = createBlogGeneratedPostsStorageController()

const shuffle = <T>(items: T[]) => {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        const previousValue = items[index]
        items[index] = items[swapIndex]
        items[swapIndex] = previousValue
    }

    return items
}

const setTagButtonState = (tagButton: HTMLButtonElement, isActive: boolean) => {
    tagButton.classList.toggle('is-active', isActive)
    tagButton.setAttribute('aria-pressed', String(isActive))
}

const toggleTagButtonState = (tagButton: HTMLButtonElement) => {
    const isActive = !tagButton.classList.contains('is-active')
    setTagButtonState(tagButton, isActive)
}

const setContentEditableState = (node: HTMLElement, isEditable: boolean) => {
    node.setAttribute('contenteditable', isEditable ? 'true' : 'false')
}

const placeCaretAtStart = (node: HTMLElement) => {
    const selection = window.getSelection()
    if (!selection) return

    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
}

const restoreBody = (bodyTextNode: HTMLElement) => {
    bodyTextNode.innerText = TOP_POST_ORIGINAL_BODY
}

const lockFormsTemporarily = () => {
    const formControlNodes = Array.from(
        document.querySelectorAll<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement
        >('input, textarea, select, button')
    )
    const editableNodes = Array.from(document.querySelectorAll<HTMLElement>('[contenteditable]'))

    const formControlSnapshots = formControlNodes.map((formControlNode) => ({
        formControlNode,
        isDisabled: formControlNode.disabled,
    }))
    const editableSnapshots = editableNodes.map((editableNode) => ({
        editableNode,
        contentEditableValue: editableNode.getAttribute('contenteditable'),
    }))

    for (const formControlNode of formControlNodes) {
        formControlNode.disabled = true
    }

    for (const editableNode of editableNodes) {
        editableNode.setAttribute('contenteditable', 'false')
    }

    const activeNode = document.activeElement
    if (activeNode instanceof HTMLElement) activeNode.blur()

    return () => {
        for (const snapshot of formControlSnapshots) {
            snapshot.formControlNode.disabled = snapshot.isDisabled
        }

        for (const snapshot of editableSnapshots) {
            if (snapshot.contentEditableValue === null) {
                snapshot.editableNode.removeAttribute('contenteditable')
                continue
            }

            snapshot.editableNode.setAttribute('contenteditable', snapshot.contentEditableValue)
        }
    }
}

const getActivePostTags = (postNode: HTMLElement): string[] => {
    const tagButtonNodes = Array.from(postNode.querySelectorAll<HTMLButtonElement>('.blog-tag'))

    return tagButtonNodes
        .filter((tagButton) => tagButton.classList.contains('is-active'))
        .map((tagButton) => normalizeText(tagButton.innerText).toLowerCase())
        .filter((tag) => tag.length > 0)
}

const toGeneratedBlogPost = (generatedPost: BlogGenerateResponse): BlogPost | null => {
    const normalizedTitle = normalizeText(generatedPost.title)
    const normalizedParagraphs = generatedPost.paragraphs
        .map((paragraph) => normalizeText(paragraph))
        .filter((paragraph) => paragraph.length > 0)
    const normalizedTags = [
        ...new Set(generatedPost.tags.map((tag) => normalizeText(tag).toLowerCase())),
    ].filter((tag) => tag.length > 0)

    if (normalizedTitle.length === 0 || normalizedParagraphs.length === 0) {
        return null
    }

    return {
        id: normalizeText(generatedPost.id) || `generated-${Date.now()}`,
        paragraphs: normalizedParagraphs,
        tags: normalizedTags,
        title: normalizedTitle,
    }
}

const getBlogPostsForRender = (): BlogPost[] => {
    const topPost = BLOG_POSTS[TOP_POST_INDEX]
    const staticPosts = BLOG_POSTS.slice(TOP_POST_INDEX + 1)

    if (!topPost) {
        return [...generatedBlogPosts, ...staticPosts]
    }

    return [topPost, ...generatedBlogPosts, ...staticPosts]
}

const saveGeneratedPosts = () => {
    generatedPostsStorageController.saveGeneratedPosts(generatedBlogPosts)
}

const loadGeneratedPosts = () => {
    const storedPosts = generatedPostsStorageController.loadGeneratedPosts()
    generatedBlogPosts.splice(0, generatedBlogPosts.length, ...storedPosts)
}

const upsertGeneratedPost = (post: BlogPost) => {
    const existingPostIndex = generatedBlogPosts.findIndex(
        (generatedPost) => generatedPost.id === post.id
    )
    if (existingPostIndex >= 0) {
        generatedBlogPosts.splice(existingPostIndex, 1)
    }

    generatedBlogPosts.unshift(post)
    saveGeneratedPosts()
}

const initTopPostEditing = (
    postNode: HTMLElement,
    titleNode: HTMLElement,
    bodyTextNode: HTMLElement
) => {
    let isHovered = false
    let isRunning = false
    const blogGenerateController = createBlogGenerateController()

    const hasFocusWithin = (node: HTMLElement) => {
        const activeNode = document.activeElement
        return (
            activeNode === node || (activeNode instanceof HTMLElement && node.contains(activeNode))
        )
    }

    const updateEditableState = () => {
        const shouldEnableEditing =
            !isRunning && (isHovered || hasFocusWithin(titleNode) || hasFocusWithin(bodyTextNode))
        setContentEditableState(titleNode, shouldEnableEditing)
        setContentEditableState(bodyTextNode, shouldEnableEditing)
    }

    const clearTitleOnClick = () => {
        if (titleNode.innerText.trim() === TOP_POST_ORIGINAL_TITLE.trim()) {
            titleNode.innerText = ''
            titleNode.focus()
            placeCaretAtStart(titleNode)
        }
    }

    const clearBodyOnClick = () => {
        if (normalizeText(bodyTextNode.innerText) === normalizeText(TOP_POST_ORIGINAL_BODY)) {
            bodyTextNode.innerText = ''
            bodyTextNode.focus()
            placeCaretAtStart(bodyTextNode)
        }
    }

    const restoreTitleOnBlur = () => {
        if (titleNode.innerText.trim() === '') {
            titleNode.innerText = TOP_POST_ORIGINAL_TITLE
        }
    }

    const restoreBodyOnBlur = () => {
        if (normalizeText(bodyTextNode.innerText) === '') {
            restoreBody(bodyTextNode)
        }
    }

    setContentEditableState(titleNode, false)
    setContentEditableState(bodyTextNode, false)

    const runButton = document.createElement('div')
    runButton.className = 'blog-post-run-button'
    runButton.innerText = RUN_BUTTON_TEXT
    runButton.setAttribute('role', 'button')
    runButton.setAttribute('tabindex', '0')
    postNode.appendChild(runButton)

    const setRunButtonDefaultText = () => {
        runButton.innerText = RUN_BUTTON_TEXT
    }

    runButton.addEventListener('mouseleave', setRunButtonDefaultText)
    runButton.addEventListener('blur', setRunButtonDefaultText)

    const runPostGenerate = async () => {
        if (isRunning) return

        isRunning = true
        setRunButtonDefaultText()
        postNode.classList.add('blog-post-running')
        updateEditableState()

        const unlockForms = lockFormsTemporarily()
        const requestStartedAtMs = Date.now()

        let generatedPost: BlogGenerateResponse | null = null
        try {
            generatedPost = await blogGenerateController.generatePostFromDraft({
                body: normalizeText(bodyTextNode.innerText),
                requiredTags: getActivePostTags(postNode),
                title: titleNode.innerText.trim(),
            })
        } catch {
            generatedPost = null
        }

        const requestElapsedMs = Date.now() - requestStartedAtMs
        const resetDelayMs = Math.max(0, RUN_RESET_TIMEOUT_MS - requestElapsedMs)

        window.setTimeout(() => {
            let hasAddedGeneratedPost = false
            if (generatedPost) {
                const generatedBlogPost = toGeneratedBlogPost(generatedPost)
                if (generatedBlogPost) {
                    upsertGeneratedPost(generatedBlogPost)
                    hasAddedGeneratedPost = true
                }
            }

            unlockForms()

            if (hasAddedGeneratedPost) {
                rerenderBlogPosts()
                return
            }

            postNode.classList.remove('blog-post-running')
            isRunning = false
            setRunButtonDefaultText()
            updateEditableState()
        }, resetDelayMs)
    }

    runButton.addEventListener('click', () => {
        void runPostGenerate()
    })

    runButton.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        runButton.click()
    })

    postNode.addEventListener('mouseenter', () => {
        isHovered = true
        updateEditableState()
    })

    postNode.addEventListener('mouseleave', () => {
        isHovered = false
        updateEditableState()
    })

    titleNode.addEventListener('focus', updateEditableState)
    bodyTextNode.addEventListener('focus', updateEditableState)

    titleNode.addEventListener('click', clearTitleOnClick)
    bodyTextNode.addEventListener('click', clearBodyOnClick)

    titleNode.addEventListener('blur', () => {
        restoreTitleOnBlur()
        window.requestAnimationFrame(updateEditableState)
    })

    bodyTextNode.addEventListener('blur', () => {
        restoreBodyOnBlur()
        window.requestAnimationFrame(updateEditableState)
    })
}

const renderBlogPosts = (postsPanel: HTMLElement | null) => {
    if (!postsPanel) return

    postsPanel.replaceChildren()

    const fragment = document.createDocumentFragment()

    const posts = getBlogPostsForRender()

    for (const [postIndex, post] of posts.entries()) {
        const postNode = document.createElement('article')
        postNode.className = 'blog-post'

        const headerNode = document.createElement('header')
        headerNode.className = 'blog-post-header'

        const titleNode = document.createElement('div')
        titleNode.className = 'blog-post-title'
        titleNode.innerText = post.title

        headerNode.appendChild(titleNode)

        if (post.tags?.length) {
            const tagsNode = document.createElement('div')
            tagsNode.className = 'blog-post-tags'

            const shuffledTags = shuffle([...post.tags])

            for (const tag of shuffledTags) {
                const tagButton = document.createElement('button')
                tagButton.className = 'blog-tag'
                tagButton.type = 'button'
                tagButton.innerText = tag
                setTagButtonState(tagButton, false)
                tagButton.addEventListener('click', () => {
                    toggleTagButtonState(tagButton)
                })
                tagsNode.appendChild(tagButton)
            }

            headerNode.appendChild(tagsNode)
        }

        const bodyNode = document.createElement('div')
        bodyNode.className = 'blog-post-body'

        for (const paragraphText of post.paragraphs) {
            const paragraphNode = document.createElement('p')
            paragraphNode.innerText = paragraphText
            bodyNode.appendChild(paragraphNode)
        }

        postNode.appendChild(headerNode)
        postNode.appendChild(bodyNode)

        if (postIndex === TOP_POST_INDEX) {
            const bodyTextNode = bodyNode.querySelector<HTMLElement>('p') ?? bodyNode
            initTopPostEditing(postNode, titleNode, bodyTextNode)
        }

        fragment.appendChild(postNode)
    }

    postsPanel.appendChild(fragment)
}

export const rerenderBlogPosts = () => {
    const postsPanel = queryOptional<HTMLElement>(CONFIG.selectors.blogPosts)
    renderBlogPosts(postsPanel)
}

export const initBlogPage = () => {
    loadGeneratedPosts()
    rerenderBlogPosts()
}
