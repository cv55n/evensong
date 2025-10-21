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

    /**
     * expõe a lista de paths observados
     * 
     * @returns para chaining
     */
    getWatched(): Record<string, string[]> {
        const watchList: Record<string, string[]> = {};

        this._watched.forEach((entry, dir) => {
            const key = this.options.cwd ? sp.relative(this.options.cwd, dir) : dir;
            const index = key || ONE_DOT;

            watchList[index] = entry.getChildren().sort();
        });

        return watchList;
    }

    emitWithAll(event: EventName, args: EmitArgs): void {
        this.emit(event, ...args);

        if (event !== EV.ERROR)
            this.emit(EV.ALL, event, ...args);
    }

    // helpers comuns
    // --------------

    /**
     * normaliza e emite os eventos
     * 
     * chamar o _emit não significa que emit() será chamado
     * 
     * @param event tipo do evento
     * @param path path do arquivo ou diretório
     * @param stats argumentos a serem passados com o evento
     * 
     * @returns o erro caso definido
     */
    async _emit(event: EventName, path: Path, stats?: Stats): Promise<this | undefined> {
        if (this.closed)
            return;

        const opts = this.options;

        if (isWindows)
            path = sp.normalize(path);

        if (opts.cwd)
            path = sp.relative(opts.cwd, path);

        const args: EmitArgs | EmitErrorArgs = [path];

        if (stats != null)
            args.push(stats);

        const awf = opts.awaitWriteFinish;

        let pw;

        if (awf && (pw = this._pendingWrites.get(path))) {
            pw.lastChange = new Date();

            return this;
        }

        if (opts.atomic) {
            if (event === EV.UNLINK) {
                this._pendingUnlinks.set(path, [event, ...args]);

                setTimeout(() => {
                    this._pendingUnlinks.forEach((entry: EmitArgsWithName, path: Path) => {
                        this.emit(...entry);
                        this.emit(EV.ALL, ...entry);
                        this._pendingUnlinks.delete(path);
                    });
                }, typeof opts.atomic === 'number' ? opts.atomic : 100);

                return this;
            }

            if (event === EV.ADD && this._pendingUnlinks.has(path)) {
                event = EV.CHANGE;

                this._pendingUnlinks.delete(path);
            }
        }

        if (awf && (event === EV.ADD || event === EV.CHANGE) && this._readyEmitted) {
            const awfEmit = (err?: Error, stats?: Stats) => {
                if (err) {
                    event = EV.ERROR;

                    (args as unknown as EmitErrorArgs)[0] = err;
                    
                    this.emitWithAll(event, args);
                } else if (stats) {
                    // se as estatísticas não existirem o arquivo deve ter sido excluído
                    
                    if (args.length > 1) {
                        args[1] = stats;
                    } else {
                        args.push(stats);
                    }

                    this.emitWithAll(event, args);
                }
            };

            this._awaitWriteFinish(path, awf.stabilityThreshold, event, awfEmit);
            
            return this;
        }

        if (event === EV.CHANGE) {
            const isThrottled = !this._throttle(EV.CHANGE, path, 50);
            
            if (isThrottled)
                return this;
        }

        if (
            opts.alwaysStat &&
            stats === undefined &&
            (event === EV.ADD || event === EV.ADD_DIR || event === EV.CHANGE)
        ) {
            const fullPath = opts.cwd ? sp.join(opts.cwd, path) : path;

            let stats;

            try {
                stats = await stat(fullPath);
            } catch (err) {
                // não fazer nada
            }

            // suprime o evento quando fs_stat falhar, para evitar o envio de 'stat' indefinido
            if (!stats || this.closed)
                return;

            args.push(stats);
        }

        this.emitWithAll(event, args);

        return this;
    }

    /**
     * handler comum para erros
     * 
     * @returns o erro caso definido
     */
    _handleError(error: Error): Error | boolean {
        const code = error && (error as Error & { code: string }).code;

        if (
            error &&
            code !== 'ENOINT' &&
            code !== 'ENOTDIR' &&
            (!this.options.ignorePermissionErrors || (code !== 'EPERM' && code !== 'EACCES'))
        ) {
            this.emit(EV.ERROR, error);
        }

        return error || this.closed;
    }

    /**
     * utilitário auxiliar para throttling
     * 
     * @param actionType o tipo sendo limitado
     * @param path o path que está sendo seguido
     * @param timeout duração de tempo de supressão de ações duplicadas
     * 
     * @returns o objeto de rastreamento ou false se a ação deve ser suprimida
     */
    _throttle(actionType: ThrottleType, path: Path, timeout: number): Throttler | false {
        if (!this._throttled.has(actionType)) {
            this._throttled.set(actionType, new Map());
        }

        const action = this._throttled.get(actionType);
        
        if (!action)
            throw new Error('throttle inválido');
        
        const actionPath = action.get(path);

        if (actionPath) {
            actionPath.count++;

            return false;
        }

        // eslint-disable-next-line prefer-const
        let timeoutObject: NodeJS.Timeout;

        const clear = () => {
            const item = action.get(path);
            const count = item ? item.count : 0;

            action.delete(path);

            clearTimeout(timeoutObject);

            if (item)
                clearTimeout(item.timeoutObject);

            return count;
        };

        timeoutObject = setTimeout(clear, timeout);

        const thr = {
            timeoutObject,
            clear,
            count: 0
        };

        action.set(path, thr);

        return thr;
    }

    _incrReadyCount(): number {
        return this._readyCount++;
    }

    /**
     * aguarda a operação write de ser finalizada
     * 
     * @param path o path sendo seguido
     * @param threshold tempo em milissegundos que um tamanho de arquivo deve ser corrigido antes de reconhecer que a gravação do op foi concluída
     * @param event o evento
     * @param awfEmit o callback a ser chamado quando estiver pronto para o evento ser emitido.
     */
    _awaitWriteFinish(
        path: Path,
        threshold: number,
        event: EventName,
        awfEmit: (err?: Error, stat?: Stats) => void
    ): void {
        const awf = this.options.awaitWriteFinish;

        if (typeof awf !== 'object')
            return;

        const pollInterval = awf.pollInterval as unknown as number;

        let timeoutHandler: NodeJS.Timeout;

        let fullPath = path;

        if (this.options.cwd && !sp.isAbsolute(path)) {
            fullPath = sp.join(this.options.cwd, path);
        }

        const now = new Date();

        const writes = this._pendingWrites;

        function awaitWriteFinishFn(prevStat?: Stats): void {
            statcb(fullPath, (err, curStat) => {
                if (err || !writes.has(path)) {
                    if (err && err.code !== 'ENOENT')
                        awfEmit(err);

                    return;
                }

                const now = Number(new Date());

                if (prevStat && curStat.size !== prevStat.size) {
                    writes.get(path).lastChange = now;
                }

                const pw = writes.get(path);
                const df = now - pw.lastChange;

                if (df >= threshold) {
                    writes.delete(path);

                    awfEmit(undefined, curStat);
                } else {
                    timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval, curStat);
                }
            });
        }

        if (!writes.has(path)) {
            writes.set(path, {
                lastChange: now,

                cancelWait: () => {
                    writes.delete(path);
                    
                    clearTimeout(timeoutHandler);
                    
                    return event;
                }
            });

            timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
        }
    }

    /**
     * determina se o usuário solicitou ignorar este path
     */
    _isIgnored(path: Path, stats?: Stats): boolean {
        if (this.options.atomic && DOT_RE.test(path))
            return true;
        
        if (!this._userIgnored) {
            const { cwd } = this.options;
            const ign = this.options.ignored;

            const ignored = (ign || []).map(normalizeIgnored(cwd));
            const ignoredPaths = [...this._ignoredPaths];
            const list: Matcher[] = [...ignoredPaths.map(normalizeIgnored(cwd)), ...ignored];
            
            this._userIgnored = anymatch(list, undefined);
        }

        return this._userIgnored(path, stats);
    }

    _isntIgnored(path: Path, stat?: Stats): boolean {
        return !this._isIgnored(path, stat);
    }

    /**
     * fornece um conjunto de helpers e propriedades comuns relacionados ao tratamento de links simbólicos
     * 
     * @param path arquivo ou diretório sendo observado
     */
    _getWatchHelpers(path: Path): WatchHelper {
        return new WatchHelper(path, this.options.followSymlinks, this);
    }

    // helpers de diretório
    // --------------------

    /**
     * fornece os objetos de rastreamento de diretório
     * 
     * @param directory path do diretório
     */
    _getWatchedDir(directory: string): DirEntry {
        const dir = sp.resolve(directory);
        
        if (!this._watched.has(dir))
            this._watched.set(dir, new DirEntry(dir, this._boundRemove));
        
        return this._watched.get(dir)!;
    }

    // helpers de arquivo
    // ------------------

    /**
     * saiba mais sobre as permissões de leitura
     * https://stackoverflow.com/a/11781404/1358405
     */
    _hasReadPermissions(stats: Stats): boolean {
        if (this.options.ignorePermissionErrors)
            return true;
        
        return Boolean(Number(stats.mode) & 0o400);
    }

    /**
     * manipula a emissão de eventos unlink para arquivos e diretórios
     * e, por meio de recursão, para arquivos e diretórios dentro de
     * diretórios que não estão linkados
     * 
     * @param directory dentro do qual o seguinte item está localizado
     * @param item      path base do item/diretório
     */
    _remove(directory: string, item: string, isDirectory?: boolean): void {
        // se o que está sendo excluído for um diretório, obtém os paths desse
        // diretório para exclusão recursiva e limpeza do objeto monitorado
        //
        // se não for um diretório, nesteddirectorychildren será um array vazio
        
        const path = sp.join(directory, item);
        const fullPath = sp.resolve(path);

        isDirectory = isDirectory != null ? isDirectory : this._watched.has(path) || this._watched.has(fullPath);

        // evita a manipulação duplicada no caso de chegar aqui quase
        // simultaneamente por meio de vários paths (como o _handlefile e o _handledir)
        if (!this._throttle('remove', path, 100))
            return;

        // se o único arquivo monitorado for removido, observe seu retorno
        if (!isDirectory && this._watched.size === 1) {
            this.add(directory, item, true);
        }

        // isso criará uma nova entrada no objeto monitorado em ambos os casos, 
        // então precisamos fazer a verificação do diretório com antecedência
        const wp = this._getWatchedDir(path);
        const nestedDirectoryChildren = wp.getChildren();

        // recursivamente remove os arquivos/diretórios children
        nastedDirectoryChildren.forEach((nasted) => this._remove(path, nasted));

        // checa se o item estava na lista observada e o remove
        const parent = this._getWatchedDir(directory);
        const wasTracked = parent.has(item);

        parent.remove(item);

        // corrige o issue #1042 -> paths relativos foram detectados e adicionados
        // como links simbólicos:
        //
        // (https://github.com/paulmillr/chokidar/blob/e1753ddbc9571bdc33b4a4af172d52cb6e611c10/lib/nodefs-handler.js#L612)
        //
        // mas nunca removido do mapa caso o path fosse excluído
        //
        // isso leva a um estado incorreto se o path foi recriado:
        //
        // https://github.com/paulmillr/chokidar/blob/e1753ddbc9571bdc33b4a4af172d52cb6e611c10/lib/nodefs-handler.js#L553
        
        if (this._symlinkPaths.has(fullPath)) {
            this._symlinkPaths.delete(fullPath);
        }

        // se esperarmos que este arquivo seja totalmente gravado, cancele a espera
        let relPath = path;

        if (this.options.cwd)
            relPath = sp.relative(this.options.cwd, path);
        
        if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
            const event = this._pendingWrites.get(relPath).cancelWait();
            
            if (event === EV.ADD)
                return;
        }

        // a entrada será um diretório que acabou de ser removido ou uma entrada
        // falsa para um arquivo; em ambos os casos, temos que removê-la
        this._watched.delete(path);
        this._watched.delete(fullPath);

        const eventName: EventName = isDirectory ? EV.UNLINK_DIR : EV.UNLINK;
        
        if (wasTracked && !this._isIgnored(path))
            this._emit(eventName, path);

        // evita conflitos se mais tarde criarmos outro arquivo com o mesmo nome
        this._closePath(path);
    }

    /**
     * fecha todos os watchers para um path
     */
    _closePath(path: Path): void {
        this._closeFile(path);
        
        const dir = sp.dirname(path);
        
        this._getWatchedDir(dir).remove(sp.basename(path));
    }

    /**
     * fecha apenas watchers de arquivos em específico
     */
    _closeFile(path: Path): void {
        const closers = this._closers.get(path);
        
        if (!closers)
            return;

        closers.forEach((closer) => closer());
        
        this._closers.delete(path);
    }

    _addPathCloser(path: Path, closer: () => void): void {
        if (!closer)
            return;
        
        let list = this._closers.get(path);
        
        if (!list) {
            list = [];

            this._closers.set(path, list);
        }

        list.push(closer);
    }

    _readdirp(root: Path, opts?: Partial<ReaddirpOptions>): ReaddirpStream | undefined {
        if (this.closed)
            return;

        const options = {
            type: EV.ALL,
            alwaysStat: true,
            lstat: true,
            ...opts,
            depth: 0
        };
        
        let stream: ReaddirpStream | undefined = readdirp(root, options);
        
        this._streams.add(stream);
        
        stream.once(STR_CLOSE, () => {
            stream = undefined;
        });
        
        stream.once(STR_END, () => {
            if (stream) {
                this._streams.delete(stream);
                
                stream = undefined;
            }
        });
        
        return stream;
    }
}

/**
 * instancia o watcher com os paths a serem rastreados
 * 
 * @param paths path do arquivo/diretório
 * @param options opções, como `atomic`, `awaitwritefinish`, `ignore`, e outras
 * 
 * @returns uma instância do fswatcher para chaining
 * 
 * @example
 * const watcher = watch('.').on('all', (event, path) => { console.log(event, path); });
 * watch('.', { atomic: true, awaitWriteFinish: true, ignored: (f, stats) => stats?.isFile() && !f.endsWith('.js') });
 */
export function watch(paths: string | string[], options: ChokidarOptions = {}): FSWatcher {
    const watcher = new FSWatcher(options);

    watcher.add(paths);
    
    return watcher;
}

export default {
    watch: watch as typeof watch,
    
    FSWatcher: FSWatcher as typeof FSWatcher
};