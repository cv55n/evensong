/* descrição global, it */

const { readFileSync } = require('fs');

const assert = require('assert');

const getSourceMapFromFile = require('../lib/source-map-from-file');

describe('source-map-from-file', () => {
	it('deve analisar mapas de origem de alvos compilados', () => {
		const sourceMap = getSourceMapFromFile('./test/fixtures/all/ts-compiled/main.js');
		const expected = JSON.parse(readFileSync(require.resolve('./fixtures/all/ts-compiled/main.js.map'), 'utf8'));

		assert.deepStrictEqual(sourceMap, expected);
	});

	it('deve lidar com caracteres de espaço em branco extras', () => {
		const sourceMap = getSourceMapFromFile('./test/fixtures/source-maps/padded.js')

		assert.deepStrictEqual(sourceMap, { version: 3 });
	});

	it('deve suportar mapas de origem embutidos codificados em base64', () => {
		const sourceMap = getSourceMapFromFile('./test/fixtures/source-maps/inline.js');

		assert.strictEqual(sourceMap.version, 3);
	});
});