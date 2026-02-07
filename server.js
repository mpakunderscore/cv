const http = require('http')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const ts = require('typescript')
const dotenv = require('dotenv')

dotenv.config()

const port = Number(process.env.PORT || 4000)
const root = path.resolve(__dirname)
const distRoot = path.join(root, 'dist')
const blogGeneratePath = '/api/blog/generate'
const blogWorkerSourcePath = path.join(root, 'cloudflare', 'blog-worker.ts')
const defaultApiProxyOrigin = 'https://mpak.space'
const apiProxyOrigin = (process.env.API_PROXY_ORIGIN || '').trim() || defaultApiProxyOrigin
const workerBindings = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
}
let blogWorkerRuntime = null

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8',
}

const readRequestBody = (request, maxBytes = 1_000_000) =>
    new Promise((resolve, reject) => {
        let totalBytes = 0
        const chunks = []

        request.on('data', (chunk) => {
            totalBytes += chunk.length
            if (totalBytes > maxBytes) {
                reject(new Error('Request body too large'))
                request.destroy()
                return
            }

            chunks.push(chunk)
        })

        request.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'))
        })

        request.on('error', (error) => {
            reject(error)
        })
    })

const loadBlogWorkerRuntime = () => {
    if (blogWorkerRuntime) {
        return blogWorkerRuntime
    }

    const source = fs.readFileSync(blogWorkerSourcePath, 'utf8')
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true,
        },
    })

    const workerModule = new Module(blogWorkerSourcePath, module)
    workerModule.filename = blogWorkerSourcePath
    workerModule.paths = Module._nodeModulePaths(path.dirname(blogWorkerSourcePath))
    workerModule._compile(transpiled.outputText, blogWorkerSourcePath)

    const workerExport = workerModule.exports?.default
    if (!workerExport || typeof workerExport.fetch !== 'function') {
        throw new Error('cloudflare/blog-worker.ts did not export a valid worker')
    }

    blogWorkerRuntime = workerExport
    return blogWorkerRuntime
}

const handleBlogGenerateRequest = async (request, response, requestUrl) => {
    const requestMethod = request.method || 'GET'
    const hasRequestBody = requestMethod !== 'GET' && requestMethod !== 'HEAD'
    const requestBody = hasRequestBody ? await readRequestBody(request) : undefined
    const worker = loadBlogWorkerRuntime()

    const forwardHeaders = new Headers()
    const contentTypeHeader = request.headers['content-type']
    if (typeof contentTypeHeader === 'string' && contentTypeHeader.length > 0) {
        forwardHeaders.set('content-type', contentTypeHeader)
    }

    const workerRequest = new Request(requestUrl.toString(), {
        method: requestMethod,
        headers: forwardHeaders,
        body: requestBody,
    })

    const workerResponse = await worker.fetch(workerRequest, workerBindings)
    const responseBody = Buffer.from(await workerResponse.arrayBuffer())
    const responseHeaders = {}

    workerResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
    })

    response.writeHead(workerResponse.status, responseHeaders)
    response.end(responseBody)
}

const proxyApiRequest = async (request, response, targetUrl) => {
    const requestMethod = request.method || 'GET'
    const hasRequestBody = requestMethod !== 'GET' && requestMethod !== 'HEAD'
    const requestBody = hasRequestBody ? await readRequestBody(request) : undefined
    try {
        const proxyHeaders = {}
        const contentTypeHeader = request.headers['content-type']
        if (typeof contentTypeHeader === 'string' && contentTypeHeader.length > 0) {
            proxyHeaders['content-type'] = contentTypeHeader
        }

        const upstreamResponse = await fetch(targetUrl, {
            method: requestMethod,
            headers: proxyHeaders,
            body: requestBody,
        })
        const responseBody = Buffer.from(await upstreamResponse.arrayBuffer())
        response.writeHead(upstreamResponse.status, {
            'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8',
        })
        response.end(responseBody)
    } catch {
        response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify({ error: `Failed to proxy request to ${apiProxyOrigin}` }))
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    let pathname = decodeURIComponent(url.pathname)

    if (pathname === '/') {
        pathname = '/index.html'
    }

    if (pathname === blogGeneratePath) {
        try {
            await handleBlogGenerateRequest(req, res, url)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown blog worker error'
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'Failed to execute local blog worker', details: message }))
        }
        return
    }

    if (pathname.startsWith('/api/')) {
        const targetUrl = new URL(`${pathname}${url.search}`, apiProxyOrigin)
        await proxyApiRequest(req, res, targetUrl)
        return
    }

    let baseRoot = root
    let relativePath = pathname.replace(/^\/+/, '')

    if (pathname.startsWith('/dist/')) {
        baseRoot = distRoot
        relativePath = pathname.slice('/dist/'.length)
    }

    const filePath = path.join(baseRoot, relativePath)

    if (!filePath.startsWith(baseRoot)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.statusCode = 404
            res.end('Not found')
            return
        }

        const ext = path.extname(filePath).toLowerCase()
        const contentType = mimeTypes[ext] || 'application/octet-stream'

        res.writeHead(200, { 'Content-Type': contentType })
        fs.createReadStream(filePath).pipe(res)
    })
})

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
