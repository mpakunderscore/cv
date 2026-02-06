const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const templatePath = path.resolve(repoRoot, 'src/html/index.template.html')
const outputPath = path.resolve(repoRoot, 'index.html')

const includePattern = /^([\t ]*)<!--\s*@include\s+(.+?)\s*-->\s*$/gm

const indentText = (text, indent) =>
    text
        .split('\n')
        .map((line) => (line ? `${indent}${line}` : line))
        .join('\n')

const renderTemplate = (filePath, chain = []) => {
    const resolvedPath = path.resolve(filePath)

    if (chain.includes(resolvedPath)) {
        const cycleChain = [...chain, resolvedPath].map((item) => path.relative(repoRoot, item))
        throw new Error(`Include cycle detected: ${cycleChain.join(' -> ')}`)
    }

    const content = fs.readFileSync(resolvedPath, 'utf8')

    return content.replace(includePattern, (_, indent, relativeIncludePath) => {
        const includePath = path.resolve(path.dirname(resolvedPath), relativeIncludePath)
        if (!fs.existsSync(includePath)) {
            const from = path.relative(repoRoot, resolvedPath)
            const missing = path.relative(repoRoot, includePath)
            throw new Error(`Missing include in ${from}: ${missing}`)
        }

        const renderedInclude = renderTemplate(includePath, [...chain, resolvedPath])
        return indentText(renderedInclude, indent)
    })
}

const renderedHtml = `${renderTemplate(templatePath).trimEnd()}\n`
fs.writeFileSync(outputPath, renderedHtml)

console.log(
    `Built ${path.relative(repoRoot, outputPath)} from ${path.relative(repoRoot, templatePath)}`
)
