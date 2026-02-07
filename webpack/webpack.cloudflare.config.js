const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const cloudflareRoot = path.resolve(repoRoot, 'cloudflare')

const createCloudflareEntries = () => {
    const entry = {}
    const files = fs.readdirSync(cloudflareRoot, { withFileTypes: true })

    for (const file of files) {
        if (!file.isFile()) continue
        if (!file.name.endsWith('.ts')) continue
        if (file.name.endsWith('.d.ts')) continue

        const filePath = path.resolve(cloudflareRoot, file.name)
        const entryName = path.parse(file.name).name
        entry[entryName] = filePath
    }

    return entry
}

module.exports = {
    target: 'webworker',
    entry: createCloudflareEntries(),
    output: {
        path: path.resolve(cloudflareRoot, 'dist'),
        filename: '[name].js',
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(repoRoot, 'config/tsconfig.webpack.cloudflare.json'),
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    optimization: {
        minimize: false,
    },
    devtool: false,
}
