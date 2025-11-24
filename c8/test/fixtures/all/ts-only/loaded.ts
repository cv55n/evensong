export default function getString(i: number) {
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