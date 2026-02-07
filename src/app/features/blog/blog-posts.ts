import { BLOG_TAGS } from '@/app/features/blog/blog-tags'

export type BlogPost = {
    id: string
    title: string
    tags?: string[]
    paragraphs: string[]
}

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 'title-here',
        title: 'Title here?',
        tags: [...BLOG_TAGS],
        paragraphs: ['Describe what you want here or leave blank for random.'],
    },
    {
        id: 'robot-bci-mashup',
        title: 'Brain Meets Robot',
        tags: ['robotics', 'bci'],
        paragraphs: [
            'Imagine you get one more interface inside your head. Not a superpower — just a port: a hybrid chip that reads neural activity and outputs a low-bandwidth "intent signal." The brain isn’t a protocol. But you can still write a driver.',
            'Here’s the practical version. The chip records spikes/field signals, a model maps them into a small control vector (direction / speed / "engage" / "stop"), and the system tracks confidence. High confidence becomes action; low confidence becomes a question, a slow-down, or a veto.',
            'Now scale it to ten robots. Your brain does not micromanage motors. It sets a mode and a target: "follow me," "spread out," "inspect that," "carry this," "freeze." Each robot runs local autonomy: perception, obstacle avoidance, path planning, and a safety envelope. You steer the swarm’s intent; the swarm handles the physics.',
            'The trick is shared control. The human provides sparse intent and priorities; the robots fill in the missing details and keep you from accidentally driving them into a wall. The most important command is boring: "stop." And yes, that one should work even when your cortex is having a bad day.',
        ],
    },
    {
        id: 'quiet-future',
        title: 'The Invisible Future',
        tags: ['ai', 'coding'],
        paragraphs: [
            'The future rarely arrives with fireworks. It arrives as a habit: "Let me ask the agent first." A few months later, typing boilerplate by hand feels like hand-cranking a car.',
            'Today tools like Cursor/Codex mostly accelerate editing. The next step is decision acceleration: you describe intent, the tool proposes options, and you pick trade-offs with immediate feedback (diffs, tests, perf traces, security notes).',
            'In five years, the IDE will look like an orchestration console. You’ll run a small pack of specialized agents: context/indexer, implementer, test-runner, reviewer, security/license checker, release assistant. You’ll assign tasks, set constraints, and stop them when they start "being creative" in the wrong subsystem.',
            'Mechanically, this becomes a pipeline. The tool slices your request into a plan, creates a change-set, runs targeted tests, opens a PR, and keeps a trace of "why this line exists." The human mostly does steering: requirements, boundaries, and acceptance criteria.',
            'So programmers shift from syntax to contracts: specs, invariants, observability, rollback plans. When execution is cheap, clarity is expensive — and you pay for it either upfront in writing, or later in outages.',
            'P.S. If we want this to work like engineering rather than magic, we need documents to be first-class inputs. That’s where DDSA enters, politely, and starts asking uncomfortable questions.',
        ],
    },
    {
        id: 'ddsa-soon',
        title: 'DDSA',
        tags: ['ddsa', 'ai', 'workflow'],
        paragraphs: [
            'DDSA is Document-Driven Single-Agent Development: humans define intent in documents, one agent executes it — code, tests, PRs, and the boring parts that usually steal your week.',
            'The docs are not "communication." They’re an interface. A Design Brief says what/why. A SPEC says how it must behave (contracts, rules). A Task is one executable unit for one PR. An ADR is "why we chose this," written rarely and read often.',
            'The loop is concrete. You write goal + constraints + acceptance criteria. The agent asks questions until the unknowns are explicit. Then it drafts a plan, implements, runs tests, opens a PR, and links everything back to the documents. If acceptance criteria can’t be tested, you fix the criteria, not the code.',
            'Why single-agent? Because parallel execution creates parallel "correct" solutions, and you end up doing multiverse merge therapy. One agent gives you one line of execution and one accountable thread of reasoning.',
            'Where it fails is also concrete: vague documents. The agent will implement what you wrote, not what you meant. So you write docs like code: specific, testable, with explicit non-goals and rollback notes. Less poetry, more levers.',
            'As tools get stronger, you don’t need more magic. You need more controllability. DDSA is an attempt to make agentic development a craft — not a séance.',
        ],
    },
]
