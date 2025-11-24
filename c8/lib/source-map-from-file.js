/**
 * todo: essa lógica foi adaptada do mapa de origem interno
 * do node.js
 *
 * helpers: https://github.com/nodejs/node/blob/master/lib/internal/source_map/source_map_cache.js
 *
 * deve-se realizar correções tanto a montante quanto a jusante
 */

const { readFileSync } = require('fs');
const { fileURLToPath, pathToFileURL } = require('url');

const util = require('util');
const debuglog = util.debuglog('c8');

/**
 * extrai o url do mapa de origem de uma referência de arquivo
 * de origem: https://sourcemaps.info/spec.html
 *
 * @param {String} file - compilação do arquivo alvo
 *
 * @returns {String} path completo para o arquivo de mapa de origem
 *
 * @private
 */
function getSourceMapFromFile(filename) {
	const fileBody = readFileSync(filename).toString();
	const sourceMapLineRE = /\/[*/]#\s+sourceMappingURL=(?<sourceMappingURL>[^\s]+)/;
	const results = fileBody.match(sourceMapLineRE);

	if (results !== null) {
		const sourceMappingURL = results.groups.sourceMappingURL;
		const sourceMap = dataFromUrl(pathToFileURL(filename), sourceMappingURL);

		return sourceMap;
	} else {
		return null;
	}
}

function dataFromUrl(sourceURL, sourceMappingURL) {
	try {
		const url = new URL(sourceMappingURL);

		switch (url.protocol) {
			case 'data':
				return sourceMapFromDataUrl(url.pathname);

			default:
				return null;
		}
	} catch (err) {
		debuglog(err);

		// se nenhum esquema estiver presente, assumimos que
		// estamos lidando com um caminho de arquivo

		const mapURL = new URL(sourceMappingURL, sourceURL).href;

		return sourceMapFromFile(mapURL);
	}
}

function sourceMapFromFile(mapURL) {
	try {
		const content = readFileSync(fileURLToPath(mapURL), 'utf8');

		return JSON.parse(content);
	} catch (err) {
		debuglog(err);

		return null;
	}
}

// data:[<mediatype>][;base64],<data> veja:
// https://tools.ietf.org/html/rfc2397#section-2
function sourceMapFromDataUrl(url) {
	const {
		0: format,
		1: data
	} = url.split(',');

	const splitFormat = format.split(';');
	const contentType = splitFormat[0];
	const base64 = splitFormat[splitFormat.length - 1] === 'base64';

	if (contentType === 'application/json') {
		const decodedData = base64 ? Buffer.from(data, 'base64').toString('utf8') : data;

		try {
			return JSON.parse(decodedData);
		} catch (err) {
			debuglog(err);

			return null;
		}
	} else {
		debuglog(`tipo de conteúdo inesperado ${contentType}`);

		return null;
	}
}

module.exports = getSourceMapFromFile;