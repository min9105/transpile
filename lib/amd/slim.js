var types = require("ast-types");
var getAst = require("../get_ast");
var estemplate = require("estemplate");

var n = types.namedTypes;
var b = types.builders;

module.exports = function(load) {
	var slimAst;

	types.visit(getAst(load), {
		visitCallExpression: function(path) {
			if (this.isDefineExpression(path.node) && this.isAMD(path)) {
				var args = path.getValueProperty("arguments");

				if (this.isAnonDefineWithNoDeps(args)) {
					slimAst = makeSlimWithNoDeps(args[0]);
				} else if (this.isNamedDefineWithNoDeps(args)) {
					slimAst = makeSlimWithNoDeps(args[1]);
				} else if (this.isAnonDefineWithDeps(args)) {
					slimAst = makeSlimWithDeps({
						depsNode: args[0],
						factoryNode: args[1]
					});
				}

				// stop traversing the tree, the work is done!
				this.abort();
			}

			this.traverse(path);
		},

		// checks if `define` is invoked at the top-level.
		isAMD: function(path) {
			return (
				n.Program.check(path.parent.parent.node) &&
				n.ExpressionStatement.check(path.parent.node)
			);
		},

		// whether a `define(` call is found in the AST
		isDefineExpression: function(node) {
			return n.Identifier.check(node.callee) && node.callee.name === "define";
		},

		// define(function() {});
		isAnonDefineWithNoDeps: function(defineArguments) {
			return (
				defineArguments.length === 1 &&
				n.FunctionExpression.check(defineArguments[0])
			);
		},

		// define("foo", function() {});
		isNamedDefineWithNoDeps: function(defineArguments) {
			return (
				defineArguments.length === 2 &&
				n.Literal.check(defineArguments[0]) &&
				n.FunctionExpression.check(defineArguments[1])
			);
		},

		// define(["foo"], function(foo) {});
		isAnonDefineWithDeps: function(defineArguments) {
			return (
				defineArguments.length === 2 &&
				n.ArrayExpression.check(defineArguments[0]) &&
				n.FunctionExpression.check(defineArguments[1])
			);
		}
	});

	return slimAst || getAst(load);
};

function makeSlimWithNoDeps(factoryNode) {
	return estemplate.compile("function f() { %= body % }")({
		body: factoryNode.body.body
	});
}

function makeSlimWithDeps(options) {
	var depsNode = options.depsNode;
	var factoryNode = options.factoryNode;
	var template = estemplate.compile("function f(stealRequire) { %= body % }");

	var depsIds = getDependenciesIds(depsNode);
	var depsVars = getDependenciesVars(factoryNode);

	var requires = makeStealRequires(depsVars, depsIds);
	var factoryBody = factoryNode.body.body;

	return template({
		body: requires.concat(factoryBody)
	});
}

function makeStealRequires(vars, ids) {
	return ids.map(function(id, index) {
		return b.variableDeclaration("var", [
			b.variableDeclarator(
				b.identifier(vars[index]),
				b.callExpression(b.identifier("stealRequire"), [b.literal(id)])
			)
		]);
	});
}

function getDependenciesIds(depsNode) {
	return types.getFieldValue(depsNode, "elements").map(function(element) {
		return element.value;
	});
}

function getDependenciesVars(factoryNode) {
	return types.getFieldValue(factoryNode, "params").map(function(param) {
		return param.name;
	});
}
