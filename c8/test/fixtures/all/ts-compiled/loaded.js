"use strict";

exports.__esModule = true;

function getString(i) {
	if (typeof i === 'number') {
		if (isNaN(i)) {
			return 'NaN';
		} else if (i === 0) {
			return 'zero';
		} else if (i > 0) {
			return 'positivo';
		} else {
			return 'negativo';
		}
	} else {
		return 'que?';
	}
}

exports["default"] = getString;

// # sourcemappingurl = loaded.js.map