module.exports = {
	entry: './index.js',
	devtool: 'source-map',
	target: 'node',
	optimization: {
		minimize: false
	},
	output: {
		path: __dirname,
		filename: 's3-ghost.js',
	},
}
