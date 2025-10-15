// shim para utilizar o process em navegadores
var process = module.exports = {};

// armazenado em cache de qualquer global presente para que os
// runners de teste que o stub não quebrem nada. está dentro de
// uma função porque try/catches desotimizam em algumas engines

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimeout() {
    throw new Error('settimeout não foi definido');
}

function defaultClearTimeout() {
    throw new Error('cleartimeout não foi definido');
}

(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimeout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimeout;
    }

    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
}());

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        // ambientes normais em situações sanas
        return setTimeout(fun, 0);
    }

    // se settimeout não estiver disponível mas já foi definido
    if ((cachedSetTimeout === defaultSetTimeout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;

        return setTimeout(fun, 0);
    }

    try {
        return cachedSetTimeout(fun, 0);
    } catch (e) {
        try {
            return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
            return cachedSetTimeout.call(this, fun, 0);
        }
    }
}

function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        // ambientes normais em situações sanas
        return clearTimeout(marker);
    }

    // se cleartimeout não estiver disponível mas já foi definido
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;

        return clearTimeout(marker);
    }

    try {
        return cachedClearTimeout(marker);
    } catch (e) {
        try {
            return cachedClearTimeout.call(null, marker);
        } catch (e) {
            return cachedClearTimeout.call(this, marker);
        }
    }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }

    draining = false;

    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }

    if (queue.index) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }

    var timeout = runTimeout(cleanUpNextTick);

    draining = true;

    var len = queue.length;

    while(len) {
        currentQueue = queue;

        queue = [];

        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        
        queueIndex = -1;

        len = queue.length;
    }

    currentQueue = null;
    draining = false;
    
    runClearTimeout(timeout);
}

process.nextTick = function(fun) {
    var args = new Array(arguments.length - 1);

    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }

    queue.push(new Item(fun, args));

    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 simpatiza com objetos previsíveis
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}

Item.prototype.run = function() {
    this.fun.apply(null, this.array);
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // string vazia para isolar problemas com regexp
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function(name) {
    return []
}

process.binding = function(name) {
    throw new Error('process.binding não é suportado');
};

process.cwd = function() {
    return '/'
};

process.chdir = function(dir) {
    throw new Error('process.chdir não é suportado');
};

process.umask = function() {
    return 0;
};