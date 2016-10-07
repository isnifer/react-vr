const webpack = require('webpack');
const path = require('path');

const includeFolders = folders => folders.map(item => path.resolve(__dirname, item));

module.exports = {
    devServer: {
        historyApiFallback: true,
        inline: true,
        progress: true,
        port: 8080
    },
    entry: [
        'webpack/hot/dev-server',
        'webpack-dev-server/client?http://localhost:8080',
        path.resolve(__dirname, 'examples/index.js'),
    ],
    output: {
        path: __dirname + '/build',
        publicPath: '/',
        filename: './bundle.js'
    },
    module: {
        loaders: [
            {test: /\.css$/, loader: 'style!css'},
            {
                test: /\.js$/,
                exclude: /node_modules/,
                include: includeFolders(['./examples', './src', './react-three/src']),
                loader: 'babel'
            },
        ],
    },
};
