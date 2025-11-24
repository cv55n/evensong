class Test {
	constructor() {
		this.map = {};
	}

	run(i) {
		this.map[i] = {};
		this.map[i].f = () => console.log("run de func");

		console.log("run de teste");
	}
}

let t = new Test();

t.run(20);
t.map[20].f();