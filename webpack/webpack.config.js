const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')

class UpdateIndexTimestampPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap('UpdateIndexTimestampPlugin', (compilation) => {
            const indexPath = path.resolve(repoRoot, 'index.html')
            const hash = compilation.hash || Date.now().toString()
            const html = fs.readFileSync(indexPath, 'utf8')
            const pattern = new RegExp('dist/index\\.js\\?v=[^"\']+', 'g')
            let nextHtml = html.replace(pattern, `dist/index.js?v=${hash}`)
            if (nextHtml === html) {
                nextHtml = html.replace('dist/index.js', `dist/index.js?v=${hash}`)
            }
            if (nextHtml !== html) {
                fs.writeFileSync(indexPath, nextHtml)
            }
        })
    }
}

module.exports = {
    entry: {
        index: './src/app/index.ts',
    },
    output: {
        path: path.resolve(repoRoot, 'dist'),
        filename: 'index.js',
        clean: true,
        publicPath: 'dist/',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [new UpdateIndexTimestampPlugin()],
    watchOptions: {
        ignored: /index\\.html$/,
    },
}
