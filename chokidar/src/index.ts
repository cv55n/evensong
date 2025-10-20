import { EventEmitter } from 'node:events';
import { stat as statcb, Stats } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { type EntryInfo, readdirp, type ReaddirpOptions, ReaddirpStream } from 'readdirp';

import {
    EMPTY_FN,
    EVENTS as EV,
    type EventName,
    isIBMi,
    isWindows,
    NodeFsHandler,
    type Path,
    STR_CLOSE,
    STR_END,
    type WatchHandlers,
} from './handler.js';

import * as sp from 'node:path';

export type AWF = {
    stabilityThreshold: number;
    pollInterval: number;
};

type BasicOpts = {
    persistent: boolean;
    ignoreInitial: boolean;
    followSymlinks: boolean;
    
    cwd?: string;

    // polling
    usePolling: boolean;
    interval: number;
    binaryInterval: number; // utilizado somente para pooling e se diferente do intervalo

    alwaysStat?: boolean;
    depth?: number;
    ignorePermissionErrors: boolean;
    atomic: boolean | number; // ou um 'delay atômico' customizado, em milissegundos (padrão é 100)
    // useAsync?: boolean; // utilizar async para métodos stat/readlink
    // ioLimit?: number; // limitar operações io paralelas (uso de cpu + limites de os)
};

export type Throttler = {
    timeoutObject: NodeJS.Timeout;

    clear: () => void;

    count: number;
};

export type ChokidarOptions = Partial<
    BasicOpts & {
        ignored: Matcher | Matcher[];

        awaitWriteFinish: boolean | Partial<AWF>;
    }
>;

export type FSWInstanceOptions = BasicOpts & {
    ignored: Matcher[]; // string | fn ->

    awaitWriteFinish: false | AWF;
}

export type ThrottleType = 'readdir' | 'watch' | 'add' | 'remove' | 'change';

export type EmitArgs = [path: Path, stats?: Stats];
export type EmitErrorArgs = [error: Error, stats?: Stats];
export type EmitArgsWithName = [event: EventName, ...EmitArgs];

export type MatchFunction = (val: string, stats?: Stats) => boolean;

export interface MatcherObject {
    path: string;
    recursive?: boolean;
}

export type Matcher = string | RegExp | MatchFunction | MatcherObject;

const SLASH = '/';
const SLASH_SLASH = '//';
const ONE_DOT = '.';
const TWO_DOTS = '..';
const STRING_TYPE = 'string';
const BACK_SLASH_RE = /\\/g;
const DOUBLE_SLASH_RE = /\/\//g;
const DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
const REPLACER_RE = /^\.[/\\]/;

function arrify<T>(item: T | T[]): T[] {
    return Array.isArray(item) ? item : [item];
}

const isMatcherObject = (matcher: Matcher): matcher is MatcherObject =>
    typeof matcher === 'object' && matcher !== null && !(matcher instanceof RegExp);

function createPattern(matcher: Matcher): MatchFunction {
    if (typeof matcher === 'function')
        return matcher;

    if (typeof matcher === 'string')
        return (string) => matcher === string;

    if (matcher instanceof RegExp)
        return (string) => matcher.test(string);

    if (typeof matcher === 'object' && matcher !== null) {
        return (string) => {
            if (matcher.path === string)
                return true;

            if (matcher.recursive) {
                const relative = sp.relative(matcher.path, string);

                if (!relative) {
                    return false;
                }

                return !relative.startsWith('..') && !sp.isAbsolute(relative);
            }

            return false;
        };
    }

    return () => false;
}

function normalizePath(path: Path): Path {
    if (typeof path !== 'string')
        throw new Error('era esperada uma string');
    
    path = sp.normalize(path);
    path = path.replace(/\\/g, '/');

    let prepend = false;

    if (path.startsWith('//'))
        // prepend = true;

    path = path.replace(DOUBLE_SLASH_RE, '/');

    if (prepend)
        path = '/' + path;

    return path;
}

function matchPatterns(patterns: MatchFunction[], testString: string, stats?: Stats): boolean {
    const path = normalizePath(testString);

    for (let index = 0; index < patterns.length; index++) {
        const pattern = patterns[index];

        if (pattern(path, stats)) {
            return true;
        }
    }

    return false;
}

function anymatch(matchers: Matcher[], testString: undefined): MatchFunction;
function anymatch(matchers: Matcher[], testString: string): boolean;
function anymatch(matchers: Matcher[], testString: string | undefined): boolean | MatchFunction {
    if (matchers == null) {
        throw new TypeError('anymatch: especifique o primeiro argumento');
    }

    // cache inicial para os matchers
    const matchersArray = arrify(matchers);
    const patterns = matchersArray.map((matcher) => createPattern(matcher));

    if (testString == null) {
        return (testString: string, stats?: Stats): boolean => {
            return matchPatterns(patterns, testString, stats);
        };
    }

    return matchPatterns(patterns, testString);
}

const unifyPaths = (paths_: Path | Path[]) => {
    const paths = arrify(paths_).flat();

    if (!paths.every((p) => typeof p === STRING_TYPE)) {
        throw new TypeError(`não-string fornecida como path de observação: ${paths}`);
    }

    return paths.map(normalizePathToUnix);
};

// caso slash_slash ocorrer no começo do path, não é substituído
// porque "//storagepc/drivepool/movies" é um path de network válido

const toUnix = (string: string) => {
    let str = string.replace(BACK_SLASH_RE, SLASH);

    let prepend = false;
    
    if (str.startsWith(SLASH_SLASH)) {
        prepend = true;
    }
    
    str = str.replace(DOUBLE_SLASH_RE, SLASH);
    
    if (prepend) {
        str = SLASH + str;
    }

    return str;
};

// nossa versão do upath.normalize
//
// todo: não equivale ao módulo path-normalize - investigar o porque
const normalizePathToUnix = (path: Path) => toUnix(sp.normalize(toUnix(path)));

// todo: refatorar
const normalizeIgnored = (cwd = '') => (path: Matcher): Matcher => {
    if (typeof path === 'string') {
        return normalizePathToUnix(sp.isAbsolute(path) ? path : sp.join(cwd, path));
    } else {
        return path;
    }
};

const getAbsolutePath = (path: Path, cwd: Path) => {
    if (sp.isAbsolute(path)) {
        return path;
    }

    return sp.join(cwd, path);
};

const EMPTY_SET = Object.freeze(new Set<string>());

/**
 * entrada do diretório
 */
class DirEntry {
    path: Path;

    _removeWatcher: (dir: string, base: string) => void;

    items: Set<Path>;

    constructor(dir: Path, removeWatcher: (dir: string, base: string) => void) {
        this.path = dir;
        this._removeWatcher = removeWatcher;
        this.items = new Set<Path>();
    }

    add(item: string): void {
        const { items } = this;

        if (!items)
            return;

        if (item !== ONE_DOT && item !== TWO_DOTS)
            items.add(item);
    }

    async remove(item: string): Promise<void> {
        const { items } = this;

        if (!items)
            return;

        items.delete(item);

        if (items.size > 0)
            return;

        const dir = this.path;

        try {
            await readdir(dir);
        } catch (err) {
            if (this._removeWatcher) {
                this._removeWatcher(sp.dirname(dir), sp.basename(dir));
            }
        }
    }

    has(item: string): boolean | undefined {
        const { items } = this;

        if (!items)
            return;

        return items.has(item);
    }

    getChildren(): string[] {
        const { items } = this;

        if (!items)
            return [];

        return [...items.values()];
    }

    dispose(): void {
        this.items.clear();
        this.path = '';
        this._removeWatcher = EMPTY_FN;
        this.items = EMPTY_SET;

        Object.freeze(this);
    }
}

const STAT_METHOD_F = 'stat';
const STAT_METHOD_L = 'lstat';

export class WatchHelper {
    fsw: FSWatcher;
    path: string;
    watchPath: string;
    fullWatchPath: string;
    dirParts: string[][];
    followSymlinks: boolean;
    statMethod: 'stat' | 'lstat';

    constructor(path: string, follow: boolean, fsw: FSWatcher) {
        this.fsw = fsw;
        
        const watchPath = path;

        this.path = path = path.replace(REPLACER_RE, '');
        this.watchPath = watchPath;
        this.fullWatchPath = sp.resolve(watchPath);
        
        this.dirParts = [];
        
        this.dirParts.forEach((parts) => {
            if (parts.length > 1)
                parts.pop();
        });

        this.followSymlinks = follow;
        this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
    }

    entryPath(entry: EntryInfo): Path {
        return sp.join(this.watchPath, sp.relative(this.watchPath, entry.fullPath));
    }

    filterPath(entry: EntryInfo): boolean {
        const { stats } = entry;

        if (stats && stats.isSymbolicLink())
            return this.filterDir(entry);
        
        const resolvedPath = this.entryPath(entry);
        
        // todo: e se stats for undefined?
        return this.fsw._isntIgnored(resolvedPath, stats) && this.fsw._hasReadPermissions(stats!);
    }

    filterDir(entry: EntryInfo): boolean {
        return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
    }
}

export interface FSWatcherEventMap {
    [EV.READY]: [];
    
    [EV.RAW]: Parameters<WatchHandlers['rawEmitter']>;
    [EV.ERROR]: Parameters<WatchHandlers['errHandler']>;

    [EV.ALL]: [event: EventName, ...EmitArgs];
    
    [EV.ADD]: EmitArgs;
    [EV.CHANGE]: EmitArgs;
    [EV.ADD_DIR]: EmitArgs;
    [EV.UNLINK]: EmitArgs;
    [EV.UNLINK_DIR]: EmitArgs;
}

/**
 * assiste arquivos e diretórios para mudanças. eventos emitidos:
 * 
 * `add`, `adddir`, `change`, `unlink`, `unlinkdir`, `all`, `error`
 * 
 * new FSWatcher()
 *     .add(diretories)
 *     .on('add', path => log('arquivo', path, 'foi adicionado'))
 */
export class FSWatcher extends EventEmitter<FSWatcherEventMap> {
    closed: boolean;
    options: FSWInstanceOptions;

    _closers: Map<string, Array<any>>;
    _ignoredPaths: Set<Matcher>;
    _throttled: Map<ThrottleType, Map<any, any>>;
    _streams: Set<ReaddirpStream>;
    _symlinkPaths: Map<Path, string | boolean>;
    _watched: Map<string, DirEntry>;

    _pendingWrites: Map<string, any>;
    _pendingUnlinks: Map<string, EmitArgsWithName>;
    _readyCount: number;
    _emitReady: () => void;
    _closePromise?: Promise<void>;
    _userIgnored?: MatchFunction;
    _readyEmitted: boolean;
    _emitRaw: WatchHandlers['rawEmitter'];
    _boundRemove: (dir: string, item: string) => void;

    _nodeFsHandler: NodeFsHandler;

    // não recuar métodos por uma questão de histórico; por enquanto
    constructor(_opts: ChokidarOptions = {}) {
        super();

        this.closed = false;

        this._closers = new Map();
        this._ignoredPaths = new Set<Matcher>();
        this._throttled = new Map();
        this._streams = new Set();
        this._symlinkPaths = new Map();
        this._watched = new Map();

        this._pendingWrites = new Map();
        this._pendingUnlinks = new Map();
        this._readyCount = 0;
        this._readyEmitted = false;

        const awf = _opts.awaitWriteFinish;

        const DEF_AWF = {
            stabilityThreshold: 2000,
            pollInterval: 100
        };

        const opts: FSWInstanceOptions = {
            // padrão
            persistent: true,
            ignoreInitial: false,
            ignorePermissionErrors: false,
            interval: 100,
            binaryInterval: 300,
            followSymlinks: true,
            usePolling: false,
            // useAsync: false,
            atomic: true, // nota: substituído mais tarde (depende de usepolling)
            ..._opts,

            // alterar formato
            ignored: _opts.ignored ? arrify(),

            awaitWriteFinish: awf === true ? DEF_AWF : typeof awf === 'object' ? { ...DEF_AWF, ...awf } : false
        };

        // sempre usar a pesquisa como padrão no ibm i porque fs.watch() não está disponível no ibm i
        if (isIBMi)
            opts.usePolling = true;

        // a normalização de escrita atômica do editor é habilitada por padrão com fs.watch
        if (opts.atomic === undefined)
            opts.atomic = !opts.usePolling;

        // opts.atomic = typeof _opts.atomic === 'number' ? _opts.atomic : 100;

        // override global. útil para desenvolvedores, que precisam forçar o polling
        // para todas as instâncias do chokidar, independentemente do uso/profundidade de dependência
        const envPoll = process.env.CHOKIDAR_USEPOLLING;

        if (envPoll !== undefined) {
            const envLower = envPoll.toLowerCase();

            if (envLower === 'false' || envLower === '0')
                opts.usePolling = false;
            else if (envLower === 'true' || envLower === '1')
                opts.usePolling = true;
            else opts.usePolling = !!envLower;
        }

        const envInterval = process.env.CHOKIDAR_INTERVAL;

        if (envInterval)
            opts.interval = Number.parseInt(envInterval, 10);

        // isso é feito para emitir pronto apenas uma vez, mas cada 'add' aumentará isso?
        let readyCalls = 0;

        this._emitReady = () => {
            readyCalls++;

            if (readyCalls >= this._readyCount) {
                this._emitReady = EMPTY_FN;
                this._readyEmitted = true;

                // utilizar process.nexttick para permitir o tempo para o listener
                process.nextTick(() => this.emit(EV.READY));
            }
        };

        this._emitRaw = (...args) => this.emit(EV.RAW, ...args);

        this._boundRemove = this._remove.bind(this);

        this.options = opts;
        this._nodeFsHandler = new NodeFsHandler(this);

        Object.freeze(opts);
    }

    _addIgnoredPath(matcher: Matcher): void {
        if (isMatcherObject(matcher)) {
            // retornar mais cedo se já tivermos um objeto matcher profundamente igual
            for (const ignored of this._ignoredPaths) {
                if (isMatcherObject(ignored) && ignored.path === matcher.path && ignored.recursive === matcher.recursive) {
                    return;
                }
            }
        }

        this._ignoredPaths.add(matcher);
    }

    _removeIgnoredPath(matcher: Matcher): void {
        this._ignoredPaths.delete(matcher);

        // agora encontrar qualquer objeto correspondente com o correspondente como o path
        if (typeof matcher === 'string') {
            for (const ignored of this._ignoredPaths) {
                // todo (43081j): fazer isso ser mais eficiente
                // 
                // provavelmente apenas fazer um `this._ignoreddirectories`
                // ou qualquer coisa assim

                if (isMatcherObject(ignored) && ignored.path === matcher) {
                    this._ignoredPaths.delete(ignored);
                }
            }
        }
    }

    // métodos públicos

    /**
     * adiciona paths a serem assistidos em uma instância fswatcher já existente
     * 
     * @param paths_ arquivo ou lista de arquivos. outros argumentos não são utilizados
     */
    add(paths_: Path | Path[], _origAdd?: string, _internal?: boolean): FSWatcher {
        const { cwd } = this.options;

        this.closed = false;
        this._closePromise = undefined;
        
        let paths = unifyPaths(paths_);

        if (cwd) {
            paths = paths.map((path) => {
                const absPath = getAbsolutePath(path, cwd);

                // checar `path` em vez de `abspath` porque a parte cwd não pode ser um glob
                return absPath;
            });
        }

        paths.forEach((path) => {
            this._removeIgnoredPath(path);
        });

        this._userIgnored = undefined;

        if (!this._readyCount)
            this._readyCount = 0;
        
        this._readyCount += paths.length;

        Promise.all(
            paths.map(async (path) => {
                const res = await this._nodeFsHandler._addToNodeFs(
                    path,
                    !_internal,
                    undefined,
                    0,
                    _origAdd
                );

                if (res)
                    this._emitReady();

                return res;
            })
        ).then((results) => {
            if (this.closed)
                return;
            
            results.forEach((item) => {
                if (item)
                    this.add(sp.dirname(item), sp.basename(_origAdd || item));
            });
        });

        return this;
    }

    /**
     * fechar watchers ou iniciar a ignoração de eventos de paths específicos
     */
    unwatch(paths_: Path | Path[]): FSWatcher {
        if (this.closed)
            return this;

        const paths = unifyPaths(paths_);
        const { cwd } = this.options;

        paths.forEach((path) => {
            // converter para path absoluto, a menos que o path relativo já corresponda
            if (!sp.isAbsolute(path) && !this._closers.has(path)) {
                if (cwd)
                    path = sp.join(cwd, path);

                path = sp.resolve(path);
            }

            this._closePath(path);
            this._addIgnoredPath(path);

            if (this._watched.has(path)) {
                this._addIgnoredPath({
                    path,
                    recursive: true
                });
            }

            // resetar o userignored armazenado para fazer
            // as mudanças de ignoredpaths serem efetivas
            this._userIgnored = undefined;
        });

        return this;
    }

    /**
     * fechar watchers e remover todos os ouvintes dos paths observados
     */
    close(): Promise<void> {
        if (this._closePromise) {
            return this._closePromise;
        }

        this.closed = true;

        // gerenciamento de memória
        this.removeAllListeners();

        const closers: Array<Promise<void>> = [];

        this._closers.forEach((closerList) => closerList.forEach((closer) => {
            const promise = closer();

            if (promise instanceof Promise)
                closers.push(promise);
        }));

        this._streams.forEach((stream) => stream.destroy());
        this._userIgnored = undefined;
        this._readyCount = 0;
        this._readyEmitted = false;
        this._watched.forEach((dirent) => dirent.dispose());

        this._closers.clear();
        this._watched.clear();
        this._streams.clear();
        this._symlinkPaths.clear();
        this._throttled.clear();

        this._closePromise = closers.length
            ? Promise.all|(closers).then(() => undefined)
            : Promise.resolve();

        return this._closePromise;
    }
}