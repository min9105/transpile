function f(stealRequire) {
    var es6 = stealRequire('basics/es6module');
    return {
        name: 'module',
        es6module: es6
    };
}