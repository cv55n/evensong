global.watcher = require('./index.js').default.watch('.', {
    ignored: /node_modules|\.git/,

    persistent: true,

    // followSymlinks: false,
    // useFsEvents: false,
    // usePolling: false
})
    .on('all', (event, path) => { console.log(event, path); })
    .on('ready', () => { console.log('pronto'); })
    // .on('raw', console.log.bind(console, 'evento cru:'))