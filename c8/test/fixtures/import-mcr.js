const importMCR = async() => {
	const Report = require('../../lib/report');

	const report = Report({
		monocartArgv: {}
	});

	report.importMonocart = () => {
		throw new Error('módulo não encontrado');
	}

	await report.run();
}

importMCR();