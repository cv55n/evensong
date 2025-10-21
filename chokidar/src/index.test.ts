import { afterEach, beforeEach, describe, it } from 'micro-should';
import { deepEqual, equal, ok, throws } from 'node:assert/strict';
import { exec as cexec } from 'node:child_process';

import {
    appendFile,
    mkdir as mkd,
    readFile as read,
    rename,
    rm,
    symlink,
    unlink,
    writeFile as write
} from 'node:fs/promises';

import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { promisify } from 'node:util';
import { type Spy, type SpyFn, spy as createSpy } from 'tinyspy';
import type { EmitArgs, FSWatcherEventMap } from './index.js';
import { EVENTS as EV, isIBMi, isMacos, isWindows } from './handler.js';

import * as sp from 'node:path';
import upath from 'upath';
import * as chokidar from './index.js';

const TEST_TIMEOUT = 32000; // ms
const imetaurl = import.meta.url;
const FIXTURES_PATH = sp.join(tmpdir(), 'chokidar-' + time());
const WATCHERS: chokidar.FSWatcher[] = [];

let testId = 0;
let currentDir: string;
let USE_SLOW_DELAY: number | undefined;

function time() {
    return Date.now().toString();
}

const exec = promisify(cexec);

function rmr(dir: string) {
    return rm(dir, { recursive: true, force: true });
}

function mkdir(dir: string, opts = {}) {
    const mode = 0o755; // leitura + execução
    
    return mkd(dir, { mode: mode, ...opts });
}

function calledWith<TArgs extends unknown[], TReturn>(
    spy: Spy<TArgs, TReturn>,
    args: TArgs,
    strict?: boolean
): boolean {
    return getCallsWith(spy, args, strict).length > 0;
}

function getCallsWith<TArgs extends unknown[], TReturn>(
    spy: Spy<TArgs, TReturn>,
    args: TArgs,
    strict?: boolean
): TArgs[] {
    return spy.calls.filter(
        (call) => (!strict || args.length === call.length) && args.every((arg, i) => call[i] === arg)
    );
}

function alwaysCalledWith<TArgs extends unknown[], TReturn>(
    spy: Spy<TArgs, TReturn>,
    args: TArgs,
    strict?: boolean
): boolean {
    return spy.calls.every(
        (call) => (!strict || args.length === call.length) && args.every((arg, i) => call[i] === arg)
    );
}

// spyonready
const aspy = (
    watcher: chokidar.FSWatcher,
    eventName: string,
    spy: SpyFn | null = null,
    noStat: boolean = false
): Promise<Spy> => {
    if (typeof eventName !== 'string') {
        throw new TypeError('aspy: eventname deve ser uma string');
    }

    if (spy == null)
        spy = createSpy();
    
    return new Promise((resolve, reject) => {
        const handler = noStat
            ? eventName === EV.ALL
                ? (event: string, path: string) => spy(event, path)
                : (path: string) => spy(path)
            : spy;

        const timeout = setTimeout(() => {
            reject(new Error('timeout'));
        }, TEST_TIMEOUT);

        watcher.on(EV.ERROR, (...args) => {
            clearTimeout(timeout);
            
            reject(...args);
        });

        watcher.on(EV.READY, () => {
            clearTimeout(timeout);
            
            resolve(spy);
        });

        watcher.on(eventName as keyof FSWatcherEventMap, handler);
    });
};

const waitForWatcher = (watcher: chokidar.FSWatcher) => {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('timeout'));
        }, TEST_TIMEOUT);

        watcher.on(EV.ERROR, (...args) => {
            clearTimeout(timeout);

            reject(...args);
        });

        watcher.on(EV.READY, (...args) => {
            clearTimeout(timeout);

            resolve(...args);
        });
    });
};

async function delay(delayTime?: number) {
    return new Promise<void>((resolve) => {
        const timer = delayTime || USE_SLOW_DELAY || 20;

        setTimeout(resolve, timer);
    });
}

// path do diretório
function dpath(subPath: string) {
    const subd = (testId && testId.toString()) || '';

    return sp.join(FIXTURES_PATH, subd, subPath);
}

// path do glob
function gpath(subPath: string) {
    const subd = (testId && testId.toString()) || '';

    return upath.join(FIXTURES_PATH, subd, subPath);
}

currentDir = dpath('');

function cwatch(
    path: Parameters<typeof chokidar.watch>[0] = currentDir,
    opts?: chokidar.ChokidarOptions
) {
    const wt = chokidar.watch(path, opts);
    
    WATCHERS.push(wt);

    return wt;
}

function isSpyReady(spy: Spy | [spy: Spy, callCount: number, args?: unknown[]]): boolean {
    if (Array.isArray(spy)) {
        const [spyFn, callCount, args] = spy;

        if (args) {
            return getCallsWith(spyFn, args).length >= callCount;
        }

        return spyFn.callCount >= callCount;
    }

    return spy.callCount >= 1;
}

function waitFor(spies: Array<Spy | [spy: Spy, callCount: number, args?: unknown[]]>) {
    if (spies.length === 0)
        throw new Error('é necessário pelo menos 1 spy');
    
    // if (spies.length > 1) throw new Error('precisa de 1 spy');
    
    return new Promise<void>((resolve, reject) => {
        let checkTimer: ReturnType<typeof setTimeout> = setInterval(() => {
            if (!spies.every(isSpyReady))
                return;
            
            clearInterval(checkTimer);
            clearTimeout(timeout);

            resolve();
        }, 20);

        const timeout = setTimeout(() => {
            clearInterval(checkTimer);
            reject(new Error('timeout de waitfor, ms passado: ' + TEST_TIMEOUT));
        }, TEST_TIMEOUT);
    });
}

function waitForEvents(watcher: chokidar.FSWatcher, count: number) {
    return new Promise<string[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('timeout de waitforevents, ms passado: ' + TEST_TIMEOUT));
        }, TEST_TIMEOUT);

        const events: string[] = [];

        const handler = (event: string, path: string) => {
            events.push(`[ALL] ${event}: ${path}`);

            if (events.length === count) {
                watcher.off('all', handler);
                
                clearTimeout(timeout);
                
                resolve(events);
            }
        };

        watcher.on('all', handler);
    });
}

const runTests = (baseopts: chokidar.ChokidarOptions) => {
    let macosFswatch = isMacos && !baseopts.usePolling;
    let win32Polling = isWindows && baseopts.usePolling;
    
    let options: chokidar.ChokidarOptions;

    USE_SLOW_DELAY = macosFswatch ? 100 : undefined;
    
    baseopts.persistent = true;

    beforeEach(function clean() {
        options = {};

        Object.keys(baseopts).forEach((key) => {
            (options as Record<PropertyKey, unknown>)[key] = baseopts[key as keyof chokidar.ChokidarOptions];
        });
    });

    describe('observa um diretório', () => {
        let readySpy: SpyFn<[], void>;
        let rawSpy: SpyFn<FSWatcherEventMap['raw'], void>;
        let watcher: chokidar.FSWatcher;
        let watcher2: chokidar.FSWatcher;

        beforeEach(async () => {
            options.ignoreInitial = true;
            options.alwaysStat = true;

            readySpy = createSpy<[], void>(function readySpy() {});
            rawSpy = createSpy<FSWatcherEventMap['raw'], void>(function rawSpy() {});
            
            watcher = cwatch(currentDir, options).on(EV.READY, readySpy).on(EV.RAW, rawSpy);
            
            await waitForWatcher(watcher);
        });

        afterEach(async () => {
            await waitFor([readySpy]);
            await watcher.close();

            equal(readySpy.callCount, 1);
        });

        it('deve produzir uma instância do chokidar.fswatcher', () => {
            ok(watcher instanceof chokidar.FSWatcher);
        });

        it('deve expor os métodos de uma api pública', () => {
            ok(typeof watcher.on === 'function');
            ok(typeof watcher.emit === 'function');
            ok(typeof watcher.add === 'function');
            ok(typeof watcher.close === 'function');
            ok(typeof watcher.getWatched === 'function');
        });

        it('deve emitir o evento `add` quando um arquivo for adicionado', async () => {
            const testPath = dpath('add.txt');
            const spy = createSpy<EmitArgs, void>(function addSpy() {});
            
            watcher.on(EV.ADD, spy);
            
            await delay();
            await write(testPath, time());
            await waitFor([spy]);
            
            equal(spy.callCount, 1);
            
            ok(calledWith(spy, [testPath]));
            ok(spy.calls[0][1]); // estatísticas
            ok(rawSpy.called);
        });

        it('deve emitir nove eventos `add` quando nove arquivos forem adicionados em um diretório', async () => {
            const paths: string[] = [];

            for (let i = 1; i <= 9; i++) {
                paths.push(dpath(`add${i}.txt`));
            }

            const spy = createSpy();
            
            watcher.on(EV.ADD, (path) => {
                spy(path);
            });

            await write(paths[0], time());
            await write(paths[1], time());
            await write(paths[2], time());
            await write(paths[3], time());
            await write(paths[4], time());
            await delay(100);

            await write(paths[5], time());
            await write(paths[6], time());

            await delay(150);
            await write(paths[7], time());
            await write(paths[8], time());

            await waitFor([[spy, 4]]);

            await delay(1000);
            await waitFor([[spy, 9]]);

            paths.forEach((path) => {
                ok(calledWith(spy, [path]));
            });
        });

        it('deve emitir trinta e três eventos `add` quando trinta e três arquivos forem adicionados em nove diretórios', async () => {
            await watcher.close();

            const test1Path = dpath('add1.txt');
            const testb1Path = dpath('b/add1.txt');
            const testc1Path = dpath('c/add1.txt');
            const testd1Path = dpath('d/add1.txt');
            const teste1Path = dpath('e/add1.txt');
            const testf1Path = dpath('f/add1.txt');
            const testg1Path = dpath('g/add1.txt');
            const testh1Path = dpath('h/add1.txt');
            const testi1Path = dpath('i/add1.txt');
            const test2Path = dpath('add2.txt');
            const testb2Path = dpath('b/add2.txt');
            const testc2Path = dpath('c/add2.txt');
            const test3Path = dpath('add3.txt');
            const testb3Path = dpath('b/add3.txt');
            const testc3Path = dpath('c/add3.txt');
            const test4Path = dpath('add4.txt');
            const testb4Path = dpath('b/add4.txt');
            const testc4Path = dpath('c/add4.txt');
            const test5Path = dpath('add5.txt');
            const testb5Path = dpath('b/add5.txt');
            const testc5Path = dpath('c/add5.txt');
            const test6Path = dpath('add6.txt');
            const testb6Path = dpath('b/add6.txt');
            const testc6Path = dpath('c/add6.txt');
            const test7Path = dpath('add7.txt');
            const testb7Path = dpath('b/add7.txt');
            const testc7Path = dpath('c/add7.txt');
            const test8Path = dpath('add8.txt');
            const testb8Path = dpath('b/add8.txt');
            const testc8Path = dpath('c/add8.txt');
            const test9Path = dpath('add9.txt');
            const testb9Path = dpath('b/add9.txt');
            const testc9Path = dpath('c/add9.txt');

            await mkdir(dpath('b'));
            await mkdir(dpath('c'));
            await mkdir(dpath('d'));
            await mkdir(dpath('e'));
            await mkdir(dpath('f'));
            await mkdir(dpath('g'));
            await mkdir(dpath('h'));
            await mkdir(dpath('i'));

            await delay();

            readySpy.reset();
            
            watcher2 = cwatch(currentDir, options).on(EV.READY, readySpy).on(EV.RAW, rawSpy);
            
            const spy = await aspy(watcher2, EV.ADD, null, true);

            const filesToWrite = [
                test1Path,
                test2Path,
                test3Path,
                test4Path,
                test5Path,
                test6Path,
                test7Path,
                test8Path,
                test9Path,
                testb1Path,
                testb2Path,
                testb3Path,
                testb4Path,
                testb5Path,
                testb6Path,
                testb7Path,
                testb8Path,
                testb9Path,
                testc1Path,
                testc2Path,
                testc3Path,
                testc4Path,
                testc5Path,
                testc6Path,
                testc7Path,
                testc8Path,
                testc9Path,
                testd1Path,
                teste1Path,
                testf1Path,
                testg1Path,
                testh1Path,
                testi1Path
            ];

            let currentCallCount = 0;

            for (const fileToWrite of filesToWrite) {
                await write(fileToWrite, time());
                await waitFor([[spy, ++currentCallCount]]);
            }

            ok(calledWith(spy, [test1Path]));
            ok(calledWith(spy, [test2Path]));
            ok(calledWith(spy, [test3Path]));
            ok(calledWith(spy, [test4Path]));
            ok(calledWith(spy, [test5Path]));
            ok(calledWith(spy, [test6Path]));
            ok(calledWith(spy, [test7Path]));
            ok(calledWith(spy, [test8Path]));
            ok(calledWith(spy, [test9Path]));
            ok(calledWith(spy, [testb1Path]));
            ok(calledWith(spy, [testb2Path]));
            ok(calledWith(spy, [testb3Path]));
            ok(calledWith(spy, [testb4Path]));
            ok(calledWith(spy, [testb5Path]));
            ok(calledWith(spy, [testb6Path]));
            ok(calledWith(spy, [testb7Path]));
            ok(calledWith(spy, [testb8Path]));
            ok(calledWith(spy, [testb9Path]));
            ok(calledWith(spy, [testc1Path]));
            ok(calledWith(spy, [testc2Path]));
            ok(calledWith(spy, [testc3Path]));
            ok(calledWith(spy, [testc4Path]));
            ok(calledWith(spy, [testc5Path]));
            ok(calledWith(spy, [testc6Path]));
            ok(calledWith(spy, [testc7Path]));
            ok(calledWith(spy, [testc8Path]));
            ok(calledWith(spy, [testc9Path]));
            ok(calledWith(spy, [testd1Path]));
            ok(calledWith(spy, [teste1Path]));
            ok(calledWith(spy, [testf1Path]));
            ok(calledWith(spy, [testg1Path]));
            ok(calledWith(spy, [testh1Path]));
            ok(calledWith(spy, [testi1Path]));
        });

        it('deve emitir o evento `adddir` quando um diretório for adicionado', async () => {
            const testDir = dpath('subdir');
            const spy = createSpy<EmitArgs, void>(function addDirSpy() {});
            
            watcher.on(EV.ADD_DIR, spy);
            
            equal(spy.called, false);
            await mkdir(testDir);
            await waitFor([spy]);
            
            equal(spy.callCount, 1);
            
            ok(calledWith(spy, [testDir]));
            ok(spy.calls[0][1]); // estatísticas
            ok(rawSpy.called);
        });

        it('deve emitir o evento `change` quando um arquivo for alterado', async () => {
            const testPath = dpath('change.txt');
            const spy = createSpy<EmitArgs, void>(function changeSpy() {});
            
            watcher.on(EV.CHANGE, spy);
            
            equal(spy.called, false);
            
            await write(testPath, time());
            await waitFor([spy]);
            
            ok(calledWith(spy, [testPath]));
            ok(spy.calls[0][1]); // estatísticas
            ok(rawSpy.called);
            
            equal(spy.callCount, 1);
        });

        it('deve emitir o evento `unlink` quando um arquivo for removido', async () => {
            const testPath = dpath('unlink.txt');
            const spy = createSpy<EmitArgs, void>(function unlinkSpy() {});
            
            watcher.on(EV.UNLINK, spy);
            
            equal(spy.called, false);
            
            await unlink(testPath);
            await waitFor([spy]);
            
            ok(calledWith(spy, [testPath]));
            equal(!spy.calls[0][1], true); // sem estatísticas
            
            ok(rawSpy.called);
            equal(spy.callCount, 1);
        });

        it('deve emitir o evento `unlinkdir` quando um diretório for removido', async () => {
            const testDir = dpath('subdir');
            const spy = createSpy<EmitArgs, void>(function unlinkDirSpy() {});

            await mkdir(testDir);
            
            await delay(300);

            watcher.on(EV.UNLINK_DIR, spy);

            await rmr(testDir);
            await waitFor([spy]);
            
            ok(calledWith(spy, [testDir]));
            equal(!spy.calls[0][1], true); // sem estatísticas
            
            ok(rawSpy.called);
            equal(spy.callCount, 1);
        });

        it('deve emitir dois eventos `unlinkdir` quando dois diretórios forem removidos', async () => {
            const testDir = dpath('subdir');
            const testDir2 = dpath('subdir/subdir2');
            const testDir3 = dpath('subdir/subdir2/subdir3');
            const spy = createSpy<EmitArgs, void>(function unlinkDirSpy() {});

            await mkdir(testDir);
            await mkdir(testDir2);
            await mkdir(testDir3);
            await delay(300);

            watcher.on(EV.UNLINK_DIR, spy);

            await rmr(testDir2);
            await waitFor([[spy, 2]]);

            ok(calledWith(spy, [testDir2]));
            ok(calledWith(spy, [testDir3]));

            equal(!spy.calls[0][1], true); // sem estatísticas
            
            ok(rawSpy.called);
            
            equal(spy.callCount, 2);
        });

        it('deve emitir os eventos `unlink` e `add` quando um arquivo for renomeado', async () => {
            const unlinkSpy = createSpy<EmitArgs, void>(function unlink() {});
            const addSpy = createSpy<EmitArgs, void>(function add() {});
            const testPath = dpath('change.txt');
            const newPath = dpath('moved.txt');
            
            watcher.on(EV.UNLINK, unlinkSpy).on(EV.ADD, addSpy);
            
            equal(unlinkSpy.called, false);
            equal(addSpy.called, false);

            await delay();
            await rename(testPath, newPath);
            await waitFor([unlinkSpy, addSpy]);
            
            ok(calledWith(unlinkSpy, [testPath]));
            
            equal(!unlinkSpy.calls[0][1], true); // sem estatísticas
            equal(addSpy.callCount, 1);
            
            ok(calledWith(addSpy, [newPath]));
            ok(addSpy.calls[0][1]); // estatísticas
            ok(rawSpy.called);
            
            if (!macosFswatch)
                equal(unlinkSpy.callCount, 1);
        });

        it('deve emitir o evento `add`, e não `change`, quando um arquivo excluído anteriormente é adicionado novamente', async () => {
            if (isWindows) {
                console.warn('teste pulado');
            
                return true;
            }

            const unlinkSpy = createSpy<EmitArgs, void>(function unlink() {});
            const addSpy = createSpy<EmitArgs, void>(function add() {});
            const changeSpy = createSpy<EmitArgs, void>(function change() {});
            const testPath = dpath('add.txt');

            watcher.on(EV.UNLINK, unlinkSpy).on(EV.ADD, addSpy).on(EV.CHANGE, changeSpy);
            
            await write(testPath, 'hello');
            await waitFor([[addSpy, 1, [testPath]]]);
            
            equal(unlinkSpy.called, false);
            equal(changeSpy.called, false);
            
            await unlink(testPath);
            await waitFor([[unlinkSpy, 1, [testPath]]]);
            
            ok(calledWith(unlinkSpy, [testPath]));

            await delay(100);
            await write(testPath, time());
            await waitFor([[addSpy, 2, [testPath]]]);
            
            ok(calledWith(addSpy, [testPath]));
            
            equal(changeSpy.called, false);
            equal(addSpy.callCount, 2);
        });

        it('não deve emitir o evento `unlink` para arquivos movidos anteriormente', async () => {
            const unlinkSpy = createSpy<EmitArgs, void>(function unlink() {});
            const testPath = dpath('change.txt');
            const newPath1 = dpath('moved.txt');
            const newPath2 = dpath('moved-again.txt');

            watcher.on(EV.UNLINK, unlinkSpy);
            
            await rename(testPath, newPath1);

            await delay(300);
            await rename(newPath1, newPath2);
            await waitFor([[unlinkSpy, 1, [newPath1]]]);
            
            equal(getCallsWith(unlinkSpy, [testPath]).length, 1);
            equal(getCallsWith(unlinkSpy, [newPath1]).length, 1);
            equal(getCallsWith(unlinkSpy, [newPath2]).length, 0);
        });

        it('deve sobreviver o enoent para subdiretórios ausentes', async () => {
            const testDir = dpath('notadir');
            
            watcher.add(testDir);
        });
    })
}