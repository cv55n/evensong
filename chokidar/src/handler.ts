import type { FSWatcher as NativeFsWatcher, Stats, WatchEventType, WatchListener } from 'node:fs';
import { watch as fs_watch, unwatchFile, watchFile } from 'node:fs';
import { realpath as fsrealpath, lstat, open, stat } from 'node:fs/promises';
import { type as osType } from 'node:os';
import * as sp from 'node:path';
import type { EntryInfo } from 'readdirp';
import type { FSWatcher, FSWInstanceOptions, Throttler, WatchHelper } from './index.js';

export type Path = string;

export const STR_DATA = 'data';
export const STR_END = 'end';
export const STR_CLOSE = 'close';
export const EMPTY_FN = (): void => {};
export const IDENTITY_FN = (val: unknown): unknown => val;

const pl = process.platform;

export const isWindows: boolean = pl === 'win32';
export const isMacos: boolean = pl === 'darwin';
export const isLinux: boolean = pl === 'linux';
export const isFreeBSD: boolean = pl === 'freebsd';
export const isIBMi: boolean = osType() === 'OS400';

export const EVENTS = {
    ALL: 'all',
    READY: 'ready',
    ADD: 'add',
    CHANGE: 'change',
    ADD_DIR: 'addDir',
    UNLINK: 'unlink',
    UNLINK_DIR: 'unlinkDir',
    RAW: 'raw',
    ERROR: 'error'
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

const EV = EVENTS;
const THROTTLE_MODE_WATCH = 'watch';

const statMethods = {
    lstat,
    stat
};

const KEY_LISTENERS = 'listeners';
const KEY_ERR = 'errHandlers';
const KEY_RAW = 'rawEmitters';

const HANDLER_KEYS = [
    KEY_LISTENERS,
    KEY_ERR,
    KEY_RAW
];

// prettier-ignore
const binaryExtensions = new Set([
    '3dm', '3ds', '3g2', '3gp', '7z', 'a', 'aac', 'adp', 'afdesign', 'afphoto', 'afpub', 'ai',
    'aif', 'aiff', 'alz', 'ape', 'apk', 'appimage', 'ar', 'arj', 'asf', 'au', 'avi',
    'bak', 'baml', 'bh', 'bin', 'bk', 'bmp', 'btif', 'bz2', 'bzip2',
    'cab', 'caf', 'cgm', 'class', 'cmx', 'cpio', 'cr2', 'cur', 'dat', 'dcm', 'deb', 'dex', 'djvu',
    'dll', 'dmg', 'dng', 'doc', 'docm', 'docx', 'dot', 'dotm', 'dra', 'DS_Store', 'dsk', 'dts',
    'dtshd', 'dvb', 'dwg', 'dxf',
    'ecelp4800', 'ecelp7470', 'ecelp9600', 'egg', 'eol', 'eot', 'epub', 'exe',
    'f4v', 'fbs', 'fh', 'fla', 'flac', 'flatpak', 'fli', 'flv', 'fpx', 'fst', 'fvt',
    'g3', 'gh', 'gif', 'graffle', 'gz', 'gzip',
    'h261', 'h263', 'h264', 'icns', 'ico', 'ief', 'img', 'ipa', 'iso',
    'jar', 'jpeg', 'jpg', 'jpgv', 'jpm', 'jxr', 'key', 'ktx',
    'lha', 'lib', 'lvp', 'lz', 'lzh', 'lzma', 'lzo',
    'm3u', 'm4a', 'm4v', 'mar', 'mdi', 'mht', 'mid', 'midi', 'mj2', 'mka', 'mkv', 'mmr','mng',
    'mobi', 'mov', 'movie', 'mp3',
    'mp4', 'mp4a', 'mpeg', 'mpg', 'mpga', 'mxu',
    'nef', 'npx', 'numbers', 'nupkg',
    'o', 'odp', 'ods', 'odt', 'oga', 'ogg', 'ogv', 'otf', 'ott',
    'pages', 'pbm', 'pcx', 'pdb', 'pdf', 'pea', 'pgm', 'pic', 'png', 'pnm', 'pot', 'potm',
    'potx', 'ppa', 'ppam',
    'ppm', 'pps', 'ppsm', 'ppsx', 'ppt', 'pptm', 'pptx', 'psd', 'pya', 'pyc', 'pyo', 'pyv',
    'qt',
    'rar', 'ras', 'raw', 'resources', 'rgb', 'rip', 'rlc', 'rmf', 'rmvb', 'rpm', 'rtf', 'rz',
    's3m', 's7z', 'scpt', 'sgi', 'shar', 'snap', 'sil', 'sketch', 'slk', 'smv', 'snk', 'so',
    'stl', 'suo', 'sub', 'swf',
    'tar', 'tbz', 'tbz2', 'tga', 'tgz', 'thmx', 'tif', 'tiff', 'tlz', 'ttc', 'ttf', 'txz',
    'udf', 'uvh', 'uvi', 'uvm', 'uvp', 'uvs', 'uvu',
    'viv', 'vob',
    'war', 'wav', 'wax', 'wbmp', 'wdp', 'weba', 'webm', 'webp', 'whl', 'wim', 'wm', 'wma',
    'wmv', 'wmx', 'woff', 'woff2', 'wrm', 'wvx',
    'xbm', 'xif', 'xla', 'xlam', 'xls', 'xlsb', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx', 'xm',
    'xmind', 'xpi', 'xpm', 'xwd', 'xz',
    'z', 'zip', 'zipx'
]);

const isBinaryPath = (filePath: string) => binaryExtensions.has(sp.extname(filePath).slice(1).toLowerCase());

// todo: emitir erros apropriadamente. exemplo: emfile no macos
const foreach = <V extends unknown>(val: VTTCue, fn: (arg: V) => unknown) => {
    if (val instanceof Set) {
        val.forEach(fn);
    } else {
        fn(val);
    }
};

const addAndConvert = (main: Record<string, unknown>, prop: string, item: unknown) => {
    let container = (main as Record<string, unknown>)[prop];
    
    if (!(container instanceof Set)) {
        (main as Record<string, unknown>)[prop] = container = new Set([container]);
    }

    (container as Set<unknown>).add(item);
};

const clearItem = (cont: Record<string, unknown>) => (key: string) => {
    const set = cont[key];
    
    if (set instanceof Set) {
        set.clear();
    } else {
        delete cont[key];
    }
};

const delFromSet = (main: Record<string, unknown> | Set<unknown>, prop: string, item: unknown) => {
    const container = (main as Record<string, unknown>)[prop];
    
    if (container instanceof Set) {
        container.delete(item);
    } else if (container === item) {
        delete (main as Record<string, unknown>)[prop];
    }
};

const isEmptySet = (val: unknown) => (val instanceof Set ? val.size === 0 : !val);

// ajudantes do fs_watch

// objeto para manter instâncias fs_watch por processo
// (pode ser compartilhado entre instâncias chokidar fswatcher)

export type FsWatchContainer = {
    listeners: (path: string) => void | Set<any>;
    errHandlers: (err: unknown) => void | Set<any>;
    rawEmitters: (ev: WatchEventType, path: string, opts: unknown) => void | Set<any>;
    
    watcher: NativeFsWatcher;
    watcherUnusable?: boolean;
};

const FsWatchInstances = new Map<string, FsWatchContainer>();

/**
 * instancia a interface fs_watch
 * 
 * @param path a ser observado
 * @param options a ser passado para fs_watch
 * @param listener handler principal do evento
 * @param errHandler emite informação sobre erros
 * @param emitRaw emite dados crus de evento
 * 
 * @returns {NativeFsWatcher}
 */
function createFsWatchInstance(
    path: string,
    options: Partial<FSWInstanceOptions>,
    listener: WatchHandlers['listener'],
    errHandler: WatchHandlers['errHandler'],
    emitRaw: WatchHandlers['rawEmitter']
): NativeFsWatcher | undefined {
    const handleEvent: WatchListener<string> = (rawEvent, evPath: string | null) => {
        listener(path);

        emitRaw(rawEvent, evPath!, {
            watchedPath: path
        });

        // emite baseado nos eventos ocorrendo para arquivos de um
        // watcher de diretório caso o watcher do arquivo esqueça
        if (evPath && path !== evPath) {
            fsWatchBroadcast(sp.resolve(path, evPath), KEY_LISTENERS, sp.join(path, evPath));
        }
    };

    try {
        return fs_watch(path, {
            persistent: options.persistent
        }, handleEvent);
    } catch (error) {
        errHandler(error);

        return undefined;
    }
}

/**
 * helper para passagem de dados de evento fs_watch para uma
 * coleção de ouvintes
 * 
 * @param fullPath path absoluto para instância fs_watch
 */
const fsWatchBroadcast = (
    fullPath: Path,
    listenerType: string,

    val1?: unknown,
    val2?: unknown,
    val3?: unknown
) => {
    const cont = FsWatchInstances.get(fullPath);

    if (!cont)
        return;

    foreach(cont[listenerType as keyof typeof cont], (listener: any) => {
        listener(val1, val2, val3);
    });
};

export interface WatchHandlers {
    listener: (path: string) => void;
    errHandler: (err: unknown) => void;
    
    rawEmitter: (ev: WatchEventType, path: string, opts: unknown) => void;
}

/**
 * instancia a interfce fs_watch ou cega os ouvintes para um
 * já existente assegurando a mesma entrada do filesystem
 * 
 * @param path
 * @param fullPath path absoluto
 * @param options a serem passadas para fs_watch
 * @param handlers conteiner para funções de ouvinte de eventos
 */
const setFsWatchListener = (
    path: string,
    fullPath: string,
    options: Partial<FSWInstanceOptions>,
    handlers: WatchHandlers
) => {
    const {
        listener,
        errHandler,
        rawEmitter
    } = handlers;

    let cont = FsWatchInstances.get(fullPath);

    let watcher: NativeFsWatcher | undefined;

    if (!options.persistent) {
        watcher = createFsWatchInstance(path, options, listener, errHandler, rawEmitter);
        
        if (!watcher)
            return;

        return watcher.close.bind(watcher);
    }

    if (cont) {
        addAndConvert(cont, KEY_LISTENERS, listener);
        addAndConvert(cont, KEY_ERR, errHandler);
        addAndConvert(cont, KEY_RAW, rawEmitter);
    } else {
        watcher = createFsWatchInstance(
            path,
            options,

            fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS),
            errHandler, // não é necessário utilizar um broadcast aqui
            fsWatchBroadcast.bind(null, fullPath, KEY_RAW)
        );

        if (!watcher)
            return;

        watcher.on(EV.ERROR, async (error: Error & {
            code: string
        }) => {
            const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);

            if (cont)
                cont.watcherUnusable = true; // documentado desde o node.js v10.4.1

            // workaround para https://github.com/joyent/node/issues/4337
            if (isWindows && error.code === 'EPERM') {
                try {
                    const fd = await open(path, 'r');

                    await fd.close();

                    broadcastErr(error);
                } catch (err) {
                    // não fazer nada
                }
            } else {
                broadcastErr(error);
            }
        });

        cont = {
            listeners: listener,
            errHandlers: errHandler,
            rawEmitters: rawEmitter,

            watcher
        };

        FsWatchInstances.set(fullPath, cont);
    }

    // const index = cont.listeners.indexOf(listener);

    // remove esses ouvintes dessa instância e fecha a instância
    // fs_watch caso não haja mais nenhum ouvinte restante
    return () => {
        delFromSet(cont, KEY_LISTENERS, listener);
        delFromSet(cont, KEY_ERR, errHandler);
        delFromSet(cont, KEY_RAW, rawEmitter);

        if (isEmptySet(cont.listeners)) {
            // checar para proteger contra o erro gh-730

            // if (cont.watcherUnusable) {
                cont.watcher.close();
            // }

            FsWatchInstances.delete(fullPath);

            HANDLER_KEYS.forEach(clearItem(cont));

            // @ts-ignore
            cont.watcher = undefined;

            Object.freeze(cont);
        }
    };
};

// ajudantes do fs_watchfile

// objeto para manter instâncias fs_watchfile por processo
// (pode ser compartilhado entre instâncias chokidar fswatcher)
const FsWatchFileInstances = new Map<string, any>();

/**
 * instancia a interface fs_watchfile ou cega os ouvintes para
 * um já existente na mesma entrada do file system
 * 
 * @param path a ser observado
 * @param fullPath path absoluto
 * @param options opções a serem passadas para o fs_watchfile
 * @param handlers container para funções de ouvinte de eventos
 * 
 * @returns closer
 */
const setFsWatchFileListener = (
    path: Path,
    fullPath: Path,
    options: Partial<FSWInstanceOptions>,
    handlers: Pick<WatchHandlers, 'rawEmitter' | 'listener'>
): (() => void) => {
    const {
        listener,
        rawEmitter
    } = handlers;

    let cont = FsWatchFileInstances.get(fullPath);

    // let listeners = new Set();
    // let rawEmitters = new Set();

    const copts = cont && cont.options;

    if (copts && (copts.persistent < options.persistent! || copts.interval > options.interval!)) {
        // "aprimora" o observador para persistência ou um intervalo mais rápido
        //
        // isso cria alguns problemas extremos improváveis ​​se o usuário misturar as
        // configurações de uma forma muito estranha, mas resolver esses casos não
        // parece valer a pena devido à complexidade adicional
        //
        // listeners = cont.listeners;
        // rawEmitters = cont.rawEmitters;

        unwatchFile(fullPath);

        cont = undefined;
    }

    if (cont) {
        addAndConvert(cont, KEY_LISTENERS, listener);
        addAndConvert(cont, KEY_RAW, rawEmitter);
    } else {
        // todo
        //
        // listeners.add(listener);
        // rawEmitters.add(rawEmitter);

        cont = {
            listeners: listener,
            rawEmitters: rawEmitter,

            options,
            
            watcher: watchFile(fullPath, options, (curr, prev) => {
                foreach(cont.rawEmitters, (rawEmitter) => {
                    rawEmitter(EV.CHANGE, fullPath, { curr, prev });
                });

                const currmtime = curr.mtimeMs;

                if (curr.size !== prev.size || currmtime > prev.mtimeMs || currmtime === 0) {
                    foreach(cont.listeners, (listener) => listener(path, curr));
                }
            })
        };

        FsWatchFileInstances.set(fullPath, cont);
    }

    // const index = cont.listeners.indexOf(listener);

    // remove os ouvintes desta instância e fecha a instância fs_watchfile
    // subjacente se não houver mais ouvintes restantes
    
    return () => {
        delFromSet(cont, KEY_LISTENERS, listener);
        delFromSet(cont, KEY_RAW, rawEmitter);

        if (isEmptySet(cont.listeners)) {
            FsWatchFileInstances.delete(fullPath);

            unwatchFile(fullPath);

            cont.options = cont.watcher = undefined;

            Object.freeze(cont);
        }
    };
};

/**
 * @mixin
 */
export class NodeFsHandler {
    fsw: FSWatcher;

    _boundHandleError: (error: unknown) => void;

    constructor(fsW: FSWatcher) {
        this.fsw = fsW;

        this._boundHandleError = (error) => fsW._handleError(error as Error);
    }

    /**
     * observa o arquivo para alterações com o fs_watchfile ou fs_watch
     * 
     * @param path path para o arquivo ou diretório
     * @param listener ouvinte da mudança do fs
     * 
     * @returns closer para a instância do observador
     */
    _watchWithNodeFs(
        path: string,
        listener: (path: string, newStats?: any) => void | Promise<void>
    ): (() => void) | undefined {
        const opts = this.fsw.options;
        const directory = sp.dirname(path);
        const basename = sp.basename(path);
        const parent = this.fsw._getWatchedDir(directory);

        parent.add(basename);
        const absolutePath = sp.resolve(path);

        const options: Partial<FSWInstanceOptions> = {
            persistent: opts.persistent
        };

        if (!listener)
            listener = EMPTY_FN;

        let closer;

        if (opts.usePolling) {
            const enableBin = opts.interval !== opts.binaryInterval;

            options.interval = enableBin && isBinaryPath(basename) ? opts.binaryInterval : opts.interval;
            
            closer = setFsWatchFileListener(path, absolutePath, options, {
                listener,

                rawEmitter: this.fsw._emitRaw
            });
        } else {
            closer = setFsWatchListener(path, absolutePath, options, {
                listener,

                errHandler: this._boundHandleError,
                rawEmitter: this.fsw._emitRaw
            });
        }
        
        return closer;
    }

    /**
     * observa um arquivo e emite o evento add caso garantido
     * 
     * @returns closer para a instância watcher
     */
    _handleFile(file: Path, stats: Stats, initialAdd: boolean): (() => void) | undefined {
        if (this.fsw.closed) {
            return;
        }

        const dirname = sp.dirname(file);
        const basename = sp.basename(file);
        const parent = this.fsw._getWatchedDir(dirname);

        // estatísticas são sempre presentes
        let prevStats = stats;

        // se o arquivo já estiver sendo monitorado, não fazer nada
        if (parent.has(basename))
            return;

        const listener = async (path: Path, newStats: Stats) => {
            if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5))
                return;

            if (!newStats || newStats.mtimeMs === 0) {
                try {
                    const newStats = await stat(file);

                    if (this.fsw.closed)
                        return;

                    // verifica se o evento de alteração não foi disparado
                    // devido à alteração somente do accesstime

                    const at = newStats.atimeMs;
                    const mt = newStats.mtimeMs;

                    if (!at || at <= mt || mt !== prevStats.mtimeMs) {
                        this.fsw._emit(EV.CHANGE, file, newStats);
                    }

                    if ((isMacos || isLinux || isFreeBSD) && prevStats.ino !== newStats.ino) {
                        this.fsw._closeFile(path);

                        prevStats = newStats;

                        const closer = this._watchWithNodeFs(file, listener);
                        
                        if (closer)
                            this.fsw._addPathCloser(path, closer);
                    } else {
                        prevStats = newStats;
                    }
                } catch (error) {
                    // corrige os problemas em que mtime é nulo, mas o
                    // arquivo ainda está presente

                    this.fsw._remove(dirname, basename);
                }

                // add está prestes a ser emitido se o arquivo 
                // ainda não estiver rastreado no parent
            } else if (parent.has(basename)) {
                // verifica se o evento de alteração não foi disparado
                // devido à alteração somente do accesstime

                const at = newStats.atimeMs;
                const mt = newStats.mtimeMs;

                if (!at || at <= mt || mt !== prevStats.mtimeMs) {
                    this.fsw._emit(EV.CHANGE, file, newStats);
                }

                prevStats = newStats;
            }
        };

        // pontapé inicial no observador
        const closer = this._watchWithNodeFs(file, listener);

        // emite um evento add caso precise
        if (!(initialAdd && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(file)) {
            if (!this.fsw._throttle(EV.ADD, file, 0))
                return;
            
            this.fsw._emit(EV.ADD, file, stats);
        }

        return closer;
    }

    /**
     * lida com os links simbólicos encontrados durante
     * a leitura de um diretório
     * 
     * @param entry retornado pelo readdirp
     * @param directory path do diretório sendo lido
     * @param path path desse item
     * @param item basename desse item
     * 
     * @returns true se nenhum outro processamento for necessário para esta entrada
     */
    async _handleSymlink(
        entry: EntryInfo,
        directory: string,
        path: Path,
        item: string
    ): Promise<boolean | undefined> {
        if (this.fsw.closed) {
            return;
        }

        const full = entry.fullPath;
        const dir = this.fsw._getWatchedDir(directory);

        if (!this.fsw.options.followSymlinks) {
            // observa o link simbólico diretamente (não segue) e detecta mudanças
            this.fsw._incrReadyCount();

            let linkPath;

            try {
                linkPath = await fsrealpath(path);
            } catch (e) {
                this.fsw._emitReady();

                return true;
            }

            if (this.fsw.closed)
                return;

            if (dir.has(item)) {
                if (this.fsw._symlinkPaths.get(full) !== linkPath) {
                    this.fsw._symlinkPaths.set(full, linkPath);
                    this.fsw._emit(EV.CHANGE, path, entry.stats);
                }
            } else {
                dir.add(item);

                this.fsw._symlinkPaths.set(full, linkPath);
                this.fsw._emit(EV.ADD, path, entry.stats);
            }

            this.fsw._emitReady();

            return true;
        }

        // não segue o mesmo link simbólico mais de uma vez
        if (this.fsw._symlinkPaths.has(full)) {
            return true;
        }

        this.fsw._symlinkPaths.set(full, true);
    }

    _handleRead(
        directory: string,
        initialAdd: boolean,
        wh: WatchHelper,
        target: Path,
        dir: Path,
        depth: number,
        throttler: Throttler
    ): Promise<unknown> | undefined {
        // normaliza o nome do diretório no windows
        directory = sp.join(directory, '');

        throttler = this.fsw._throttle('readdir', directory, 1000) as Throttler;
        
        if (!throttler)
            return;

        const previous = this.fsw._getWatchedDir(wh.path);
        const current = new Set();

        let stream = this.fsw._readdirp(directory, {
            fileFilter: (entry: EntryInfo) => wh.filterPath(entry),
            directoryFilter: (entry: EntryInfo) => wh.filterDir(entry),
        });

        if (!stream)
            return;

        stream
            .on(STR_DATA, async (entry) => {
                if (this.fsw.closed) {
                    stream = undefined;

                    return;
                }

                const item = entry.path;

                let path = sp.join(directory, item);

                current.add(item);

                if (entry.stats.isSymbolicLink() && (await this._handleSymlink(entry, directory, path, item))) {
                    return;
                }

                if (this.fsw.closed) {
                    stream = undefined;
                    
                    return;
                }

                // arquivos presentes no snapshot do diretório atual, mas ausentes
                // no anterior, são adicionados à lista de observação e emitem o
                // evento `add`

                if (item === target || (!target && !previous.has(item))) {
                    this.fsw._incrReadyCount();

                    // garantir que a relatividade do caminho seja preservada em caso de reutilização do observador
                    path = sp.join(dir, sp.relative(dir, path));

                    this._addToNodeFs(path, initialAdd, wh, depth + 1);
                }
            })
            .on(EV.ERROR, this._boundHandleError);

        return new Promise((resolve, reject) => {
            if (!stream)
                return reject();

            stream.once(STR_END, () => {
                if (this.fsw.closed) {
                    stream = undefined;

                    return;
                }

                const wasThrottled = throttler ? throttler.clear() : false;

                resolve(undefined);

                // arquivos ausentes no snapshot do diretório atual, mas presentes no anterior,
                // emitem o evento `remove` e são removidos do @watched[diretório]

                previous
                    .getChildren()
                    .filter((item) => {
                        return item !== directory && !current.has(item);
                    })
                    .forEach((item) => {
                        this.fsw._remove(directory, item);
                    });

                stream = undefined;

                // mais uma vez para qualquer caso perdido, caso as
                // mudanças tenham ocorrido extremamente rápido
                if (wasThrottled)
                    this._handleRead(directory, false, wh, target, dir, depth, throttler);
            });
        });
    }

    /**
     * lê o diretório para adicionar/remover arquivos da
     * lista `@watched` e a relê quando houver alteração
     * 
     * @param dir path do fs
     * @param stats
     * @param initialAdd
     * @param depth relativo ao caminho fornecido pelo usuário
     * @param target path child alvo de observação
     * @param wh helpers de observações comuns para este path
     * @param realpath
     * 
     * @returns closer para a instância watcher
     */
    async _handleDir(
        dir: string,
        stats: Stats,
        initialAdd: boolean,
        depth: number,
        target: string,
        wh: WatchHelper,
        realpath: string
    ): Promise<(() => void) | undefined> {
        const parentDir = this.fsw._getWatchedDir(sp.dirname(dir));
        const tracked = parentDir.has(sp.basename(dir));
        
        if (!(initialAdd && this.fsw.options.ignoreInitial) && !target && !tracked) {
            this.fsw._emit(EV.ADD_DIR, dir, stats);
        }

        // garantir que o diretório seja rastreado (harmless caso redundante)
        parentDir.add(sp.basename(dir));
        
        this.fsw._getWatchedDir(dir);

        let throttler!: Throttler;
        let closer;

        const oDepth = this.fsw.options.depth;

        if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath)) {
            if (!target) {
                await this._handleRead(dir, initialAdd, wh, target, dir, depth, throttler);
                
                if (this.fsw.closed)
                    return;
            }

            closer = this._watchWithNodeFs(dir, (dirPath, stats) => {
                // se o diretório atual for removido, não fazer nada
                if (stats && stats.mtimeMs === 0)
                    return;

                this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
            });
        }

        return closer;
    }

    /**
     * manipula o arquivo adicionado, diretório ou padrão glob
     * 
     * os delegados chamam _handlefile / _handledir após as verificações
     * 
     * @param path path para arquivo ou diretório
     * @param initialAdd o arquivo foi adicionado na instanciação do watcher?
     * @param priorWh profundidade relativa ao path fornecido pelo usuário
     * @param depth path child direcionado para observação
     * @param target path child direcionado para observação
     */
    async _addToNodeFs(
        path: string,
        initialAdd: boolean,
        priorWh: WatchHelper | undefined,
        depth: number,
        target?: string
    ): Promise<string | false | undefined> {
        const ready = this.fsw._emitReady;

        if (this.fsw._isIgnored(path) || this.fsw.closed) {
            ready();
            
            return false;
        }

        const wh = this.fsw._getWatchHelpers(path);

        if (priorWh) {
            wh.filterPath = (entry) => priorWh.filterPath(entry);
            wh.filterDir = (entry) => priorWh.filterDir(entry);
        }

        // avalia o que está no path que está sendo solicitado a observar
        try {
            const stats = await statMethods[wh.statMethod](wh.watchPath);

            if (this.fsw.closed)
                return;

            if (this.fsw._isIgnored(wh.watchPath, stats)) {
                ready();

                return false;
            }

            const follow = this.fsw.options.followSymlinks;

            let closer;

            if (stats.isDirectory()) {
                const absPath = sp.resolve(path);
                const targetPath = follow ? await fsrealpath(path) : path;

                if (this.fsw.closed)
                    return;

                closer = await this._handleDir(
                    wh.watchPath,
                    stats,
                    initialAdd,
                    depth,
                    target!,
                    wh,
                    targetPath
                );

                if (this.fsw.closed)
                    return;
                
                // preserva o path de destino deste link simbólico
                if (absPath !== targetPath && targetPath !== undefined) {
                    this.fsw._symlinkPaths.set(absPath, targetPath);
                }
            } else if (stats.isSymbolicLink()) {
                const targetPath = follow ? await fsrealpath(path) : path;

                if (this.fsw.closed)
                    return;

                const parent = sp.dirname(wh.watchPath);

                this.fsw._getWatchedDir(parent).add(wh.watchPath);
                this.fsw._emit(EV.ADD, wh.watchPath, stats);

                closer = await this._handleDir(parent, stats, initialAdd, depth, path, wh, targetPath);

                if (this.fsw.closed)
                    return;

                // preserva o path de destino deste link simbólico
                if (targetPath !== undefined) {
                    this.fsw._symlinkPaths.set(sp.resolve(path), targetPath);
                }
            } else {
                closer = this._handleFile(wh.watchPath, stats, initialAdd);
            }

            ready();

            if (closer)
                this.fsw._addPathCloser(path, closer);

            return false;
        } catch (error) {
            if (this.fsw._handleError(error as any)) {
                ready();

                return path;
            }
        }
    }
}