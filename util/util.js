var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);

    var descriptors = {};

    for (var i = 0; i < keys.length; i++) {
        descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }

    return descriptors;
};

var formatRegExp = /%[sdj%]/g;

exports.format = function(f) {
    if (!isString(f)) {
        var objects = [];

        for (var i = 0; i < arguments.length; i++) {
            objects.push(inspect(arguments[i]));
        }

        return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;

    var str = String(f).replace(formatRegExp, function(x) {
        if (x === '%%')
            return '%';

        if (i >= len)
            return x;

        switch (x) {
            case '%s':
                return String(args[i++]);

            case '%d':
                return Number(args[i++]);

            case '%j':
                try {
                    return JSON.stringify(args[i++]);
                } catch (_) {
                    return '[circular]';
                }

            default:
                return x;
        }
    });

    for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject(x)) {
            str += ' ' + x;
        } else {
            str += ' ' + inspect(x);
        }
    }

    return str;
};

// marca que um método não deve ser usado
//
// retorna uma função modificada que avisa uma vez por padrão
//
// caso --no-deprecation esteja setado, então será um no-op
exports.deprecate = function(fn, msg) {
    if (typeof process !== 'undefined' && process.noDeprecation === true) {
        return fn;
    }

    // permite que coisas sejam depreciadas no processo de inicialização
    if (typeof process === 'undefined') {
        return function() {
            return exports.deprecate(fn, msg).apply(this, arguments);
        };
    }

    var warned = false;

    function deprecated() {
        if (!warned) {
            if (process.throwDeprecation) {
                throw new Error(msg);
            } else if (process.traceDeprecation) {
                console.trace(msg);
            } else {
                console.error(msg);
            }

            warned = true;
        }

        return fn.apply(this, arguments);
    }

    return deprecated;
};

var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
    var debugEnv = process.env.NODE_DEBUG;

    debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/,/g, '$|^')
        .toUpperCase();

    debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}

exports.debuglog = function(set) {
    set = set.toUpperCase();
    
    if (!debugs[set]) {
        if (debugEnvRegex.test(set)) {
            var pid = process.pid;
            
            debugs[set] = function() {
                var msg = exports.format.apply(exports, arguments);

                console.error('%s %d: %s', set, pid, msg);
            };
        } else {
            debugs[set] = function() {};
        }
    }

    return debugs[set];
};

/**
 * ecoa o valor de um valor
 * 
 * tenta printar o valor da melhor maneira possível, considerando
 * os diferentes tipos
 * 
 * @param {Object} obj o objeto a ser printado
 * @param {Object} opts objeto de opções opcionais que altera o output
 */
/* legacy: obj, showhidden, depth, colors */
function inspect(obj, opts) {
    // opções padrão
    var ctx = {
        seen: [],
        stylize: stylizeNoColor
    };

    // legacy...
    if (arguments.length >= 3)
        ctx.depth = arguments[2];
    
    if (arguments.length >= 4)
        ctx.colors = arguments[3];

    if (isBoolean(opts)) {
        // legacy...
        ctx.showHidden = opts;
    } else if (opts) {
        // obteu um objeto "options"
        exports._extend(ctx, opts);
    }

    // seta as opções padrão
    if (isUndefined(ctx.showHidden))
        ctx.showHidden = false;
    
    if (isUndefined(ctx.depth))
        ctx.depth = 2;
    
    if (isUndefined(ctx.colors))
        ctx.colors = false;
    
    if (isUndefined(ctx.customInspect))
        ctx.customInspect = true;
    
    if (ctx.colors)
        ctx.stylize = stylizeWithColor;
    
    return formatValue(ctx, obj, ctx.depth);
}

exports.inspect = inspect;

// https://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
    'bold' : [1, 22],
    'italic' : [3, 23],
    'underline' : [4, 24],
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
};

// não utilizar 'blue' não visível no cmd.exe
inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intencionalmente não estilizado
    'regexp': 'red'
};

function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
        return '\u001b[' + inspect.colors[style][0] + 'm' + str +
            '\u001b[' + inspect.colors[style][1] + 'm';
    } else {
        return str;
    }
}

function stylizeNoColor(str, styleType) {
    return str;
}

function arrayToHash(array) {
    var hash = {};

    array.forEach(function(val, idx) {
        hash[val] = true;
    });

    return hash;
}

function formatValue(ctx, value, recurseTimes) {
    // fornece um gancho para funções de inspeção especificadas pelo usuário
    //
    // verifica se o valor é um objeto com uma função de inspeção nele
    if (ctx.customInspect && value &&
        isFunction(value.inspect) &&
        
        // filtrar o módulo util, sua função inspect é especial
        value.inspect !== exports.inspect &&
        
        // filtrar também qualquer objeto de protótipo utilizando o check circular
        !(value.constructor && value.constructor.prototype === value)) {
        
        var ret = value.inspect(recurseTimes, ctx);

        if (!isString(ret)) {
            ret = formatValue(ctx, ret, recurseTimes);
        }

        return ret;
    }

    // tipos primitivos não podem possuir propriedades
    var primitive = formatPrimitive(ctx, value);

    if (primitive) {
        return primitive;
    }

    // observar as chaves do objeto
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
    }

    // ie não gera fields de erro não-enumeráveis
    //
    // https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Error
    if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
        return formatError(value);
    }

    // algum tipo de objeto sem propriedades pode ser reduzido
    if (keys.length === 0) {
        if (isFunction(value)) {
            var name = value.name ? ': ' + value.name : '';

            return ctx.stylize('[function' + name + ']', 'special');
        }

        if (isRegExp(value)) {
            return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        }

        if (isData(value)) {
            return ctx.stylize(Date.prototype.toString.call(value), 'date');
        }

        if (isError(value)) {
            return formatError(value);
        }
    }

    var base = '', array = false, braces = ['{', '}'];
    
    // fazer arrays dizerem que são arrays
    if (isArray(value)) {
        array = true;

        braces  ['[', ']'];
    }

    // fazer funções dizerem que são funções
    if (isFunction(value)) {
        var n = value.name ? ': ' + value.name : '';

        base = ' [Function' + n + ']';
    }

    // fazer regexps dizerem que são regexps
    if (isRegExp(value)) {
        base = ' ' + RegExp.prototype.toString.call(value);
    }

    // fazer datas com propriedades dizerem que são datas
    if (isDate(value)) {
        base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // fazer erros com mensagem dizerem que são erros
    if (isError(value)) {
        base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
        if (isRegExp(value)) {
            return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        } else {
            return ctx.stylize('[Object]', 'special');
        }
    }

    ctx.seen.push(value);

    var output;

    if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
        output = keys.map(function(key) {
            return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
}

function formatPrimitive(ctx, value) {
    if (isUndefined(value))
        return ctx.stylize('undefined', 'undefined');

    if (isString(value)) {
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        
        return ctx.stylize(simple, 'string');
    }

    if (isNumber(value))
        return ctx.stylize('' + value, 'number');
    
    if (isBoolean(value))
        return ctx.stylize('' + value, 'boolean');
    
    // por algum motivo typeof null é "object", então é um caso especial aqui.
    if (isNull(value))
        return ctx.stylize('null', 'null');
}

function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];

    for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty(value, String(i))) {
            output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
        } else {
            output.push('');
        }
    }

    keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
            output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
        }
    });

    return output;
}