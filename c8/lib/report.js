const { readdirSync, readFileSync, statSync } = require('fs');
const { isAbsolute, resolve, extname } = require('path');
const { pathToFileURL, fileURLToPath } = require('url');

// todo: voltar a usar @c88/v8-coverage assim que a correção
// for aplicada

const Exclude = require('test-exclude');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const v8toIstanbul = require('v8-to-istanbul');
const util = require('util');
const debuglog = util.debuglog('c8');

let readFile;

try {
	;({ readFile } = require('fs/promises'));
} catch (err) {
  	;({ readFile } = require('fs').promises);
}

const getSourceMapFromFile = require('./source-map-from-file');

class Report {
	constructor({
		exclude,
		extension,
		excludeAfterRemap,
		include,
		reporter,
		reporterOptions,
		reportsDirectory,
		tempDirectory,
		watermarks,
		omitRelative,
		wrapperLength,
		resolve: resolvePaths,
		all,
		src,
		allowExternal = false,
		skipFull,
		excludeNodeModules,
		mergeAsync,
		monocartArgv
	}) {
		this.reporter = reporter
		this.reporterOptions = reporterOptions || {}
		this.reportsDirectory = reportsDirectory
		this.tempDirectory = tempDirectory
		this.watermarks = watermarks
		this.resolve = resolvePaths

		this.exclude = new Exclude({
			exclude: exclude,
			include: include,
			extension: extension,
			relativePath: !allowExternal,
			excludeNodeModules: excludeNodeModules
		})

		this.excludeAfterRemap = excludeAfterRemap
		this.shouldInstrumentCache = new Map()
		this.omitRelative = omitRelative
		this.sourceMapCache = {}
		this.wrapperLength = wrapperLength
		this.all = all
		this.src = this._getSrc(src)
		this.skipFull = skipFull
		this.mergeAsync = mergeAsync
		this.monocartArgv = monocartArgv
	}

	_getSrc(src) {
		if (typeof src === 'string') {
			return [src];
		} else if (Array.isArray(src)) {
			return src;
		} else {
			return [process.cwd()];
		}
	}

	async run() {
		if (this.monocartArgv) {
			return this.runMonocart();
		}

		const context = libReport.createContext({
			dir: this.reportsDirectory,
			watermarks: this.watermarks,
			coverageMap: await this.getCoverageMapFromAllCoverageFiles()
		});

		for (const _reporter of this.reporter) {
			reports.create(_reporter, {
				skipEmpty: false,
				skipFull: this.skipFull,
				maxCols: process.stdout.columns || 100,

				...this.reporterOptions[_reporter]
			}).execute(context);
		}
	}

	async importMonocart() {
		return import('monocart-coverage-reports');
	}

	async getMonocart() {
		let MCR;

		try {
			MCR = await this.importMonocart();
		} catch (e) {
			console.error('--experimental-monocart requer o plugin monocart-coverage-reports. rode: "npm i monocart-coverage-reports@2 --save-dev"');

			process.exit(1);
		}

		return MCR;
	}

	async runMonocart() {
		const MCR = await this.getMonocart();

		if (!MCR) {
			return;
		}

		const argv = this.monocartArgv;
		const exclude = this.exclude;

		function getEntryFilter() {
			return argv.entryFilter || argv.filter || function(entry) {
				return exclude.shouldInstrument(fileURLToPath(entry.url));
			}
		}

		function getSourceFilter() {
			return argv.sourceFilter || argv.filter || function(sourcePath) {
				if (argv.excludeAfterRemap) {
					// console.log(sourcePath);

					return exclude.shouldInstrument(sourcePath);
				}

				return true;
			}
		}

		function getReports() {
			const reports = Array.isArray(argv.reporter) ? argv.reporter : [argv.reporter];
			const reporterOptions = argv.reporterOptions || {};

			return reports.map((reportName) => {
				const reportOptions = {
					...reporterOptions[reportName]
				}

				if (reportName === 'text') {
					reportOptions.skipEmpty = false;
					reportOptions.skipFull = argv.skipFull;
					reportOptions.maxCols = process.stdout.columns || 100;
				}

				return [
					reportName,
					reportOptions
				];
			});
		}

		// --all: adiciona coverage vazia para todos os arquivos
		function getAllOptions() {
			if (!argv.all) {
				return;
			}

			const src = argv.src;
			const workingDirs = Array.isArray(src) ? src : (typeof src === 'string' ? [src] : [process.cwd()]);

			return {
				dir: workingDirs,

				filter: (filePath) => {
					return exclude.shouldInstrument(filePath);
				}
			}
		}

		function initPct(summary) {
			Object.keys(summary).forEach(k => {
				if (summary[k].pct === '') {
					summary[k].pct = 100;
				}
			});

			return summary;
		}

		// adaptação de opções de cobertura
		const coverageOptions = {
			logging: argv.logging,
			name: argv.name,

			reports: getReports(),

			outputDir: argv.reportsDir,
			baseDir: argv.baseDir,

			entryFilter: getEntryFilter(),
			sourceFilter: getSourceFilter(),

			inline: argv.inline,
			lcov: argv.lcov,

			all: getAllOptions(),

			clean: argv.clean,

			// utilizar valor padrão para o istanbul
			defaultSummarizer: 'pkg',

			onEnd: (coverageResults) => {
				// para cobertura de check

				this._allCoverageFiles = {
					files: () => {
						return coverageResults.files.map(it => it.sourcePath);
					},

					fileCoverageFor: (file) => {
						const fileCoverage = coverageResults.files.find(it => it.sourcePath === file);

						return {
							toSummary: () => {
								return initPct(fileCoverage.summary);
							}
						}
					}
				}

				const coverageReport = new MCR.CoverageReport(coverageOptions);

				coverageReport.cleanCache();

				// lê os dados de cobertura v8 do diretório temporário
				await coverageReport.addFromDir(argv.tempDirectory);

				// gera o report
				await coverageReport.generate();
			}

			async getCoverageMapFromAllCoverageFiles() {
				// o processo de mesclagem pode ser muito caro
				// e, frequentemente, a verificação de
				// cobertura é acionada imediatamente após a
				// geração de um relatório
				//
				// memoriza-se o resultado de
				// getcoveragemapfromallcoveragefiles() para
				// atender a esse caso de uso

				if (this._allCoverageFiles)
					return this._allCoverageFiles;

				const map = libCoverage.createCoverageMap();

				let v8ProcessCov;

				if (this.mergeAsync) {
					v8ProcessCov = await this._getMergedProcessCovAsync();
				} else {
					v8ProcessCov = this._getMergedProcessCov();
				}

				const resultCountPerPath = new Map();

				for (const v8ScriptCov of v8ProcessCov.result) {
					try {
						const sources = this._getSourceMap(v8ScriptCov);
						const path = resolve(this.resolve, v8ScriptCov.url);

						const converter = v8toIstanbul(path, this.wrapperLength, sources, (path) => {
							if (this.excludeAfterRemap) {
								return !this._shouldInstrument(path);
							}
						});

						await converter.load();

						if (resultCountPerPath.has(path)) {
							resultCountPerPath.set(path, resultCountPerPath.get(path) + 1);
						} else {
							resultCountPerPath.set(path, 0);
						}

						converter.applyCoverage(v8ScriptCov.functions);

						map.merge(converter.toIstanbul());
					} catch (err) {
						debuglog(`arquivo: ${v8ScriptCov.url} erro: ${err.stack}`);
					}
				}

				this._allCoverageFiles = map;

				return this._allCoverageFiles;
			}

			/**
			 * retorna o mapa de origem e o arquivo de origem
			 * falso, caso estejam em cache durante a execução
			 * do node.js. isso é usado para dar suporte a
			 * ferramentas como o ts-node, que transpilam
			 * usando hooks de tempo de execução
			 *
			 * nota: requer o node.js 13+
			 *
			 * @return {Object} sourcemap e arquivo fonte falso (criado pela linha #s)
			 *
			 * @private
			 */
			_getSourceMap(v8ScriptCov) {
				const sources = {};
				const sourceMapAndLineLengths = this.sourceMapCache[pathToFileURL(v8ScriptCov.url).href];

				if (sourceMapAndLineLengths) {
					// veja: https://github.com/nodejs/node/pull/34305

					if (!sourceMapAndLineLengths.data)
						return;

					sources.sourceMap = {
						sourcemap: sourceMapAndLineLengths.data
					}

					if (sourceMapAndLineLengths.lineLengths) {
						let source = '';

						sourceMapAndLineLengths.lineLengths.forEach(length => {
							source += `${''.padEnd(length, '.')}\n`;
						});

						sources.source = source;
					}
				}

				return sources;
			}
		}
	}
}