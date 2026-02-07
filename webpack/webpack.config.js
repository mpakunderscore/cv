const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const webpack = require('webpack')
const { buildHtml } = require('../config/build-html')

const PACKAGE = require('../package.json')

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

class BuildHtmlPlugin {
    apply(compiler) {
        const htmlRoot = path.resolve(repoRoot, 'src/html')

        compiler.hooks.beforeRun.tap('BuildHtmlPlugin', () => {
            buildHtml()
        })

        compiler.hooks.watchRun.tap('BuildHtmlPlugin', () => {
            buildHtml()
        })

        compiler.hooks.thisCompilation.tap('BuildHtmlPlugin', (compilation) => {
            compilation.contextDependencies.add(htmlRoot)
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
        alias: {
            '@': path.resolve(repoRoot, 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(repoRoot, 'config/tsconfig.webpack.client.json'),
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(woff2?|ttf|otf)$/i,
                type: 'asset/inline',
            },
        ],
    },
    plugins: [
        new BuildHtmlPlugin(),
        new webpack.DefinePlugin({
            BUILD: JSON.stringify({
                packageVersion: PACKAGE.version || '0.0.0',
                gitCommit: execSync('git rev-parse --short HEAD').toString().trim().toUpperCase(),
                buildTime: new Date().toISOString(),
            }),
        }),
        new UpdateIndexTimestampPlugin(),
    ],
    watchOptions: {
        aggregateTimeout: 200,
        poll: 700,
        ignored: /node_modules|index\\.html$/,
    },
}
