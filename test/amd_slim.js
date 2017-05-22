var assert = require("assert");
var convert = require("./convert");
var amdToSlim = require("../lib/amd/slim");

describe("amd - slim", function() {
	it("anonymous and deps free", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_anon_nodeps",
			expectedFileName: "amd_nodeps_slim"
		});
	});

	it("named and deps free", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd_named_nodeps",
			expectedFileName: "amd_nodeps_slim"
		});
	});

	it("anonymous with deps", function() {
		return convert({
			converter: amdToSlim,
			sourceFileName: "amd",
			expectedFileName: "amd_deps_slim"
		});
	});
});
