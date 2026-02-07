const http = require('http')
const fs = require('fs')
const path = require('path')

const port = Number(process.env.PORT || 4000)
const root = path.resolve(__dirname)
const distRoot = path.join(root, 'dist')

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

const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    let pathname = decodeURIComponent(url.pathname)

    if (pathname === '/') {
        pathname = '/index.html'
    }

    if (pathname === '/api/hit') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(
            JSON.stringify({
                uniqueForKey: 0,
                uniqueAll: 0,
            })
        )
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
