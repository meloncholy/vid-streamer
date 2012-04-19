var load = require('../lib/load');

var test = require('tap').test;

test("load existing file", function(t) {
  var config = load(__dirname + '/../assets/test.json');
  t.similar(config, {a: 1, b: {c: 2, d: 3}}, "wrong file contents");
  t.end();
});

test("load non-existing file", function(t) {
  var config = load(__dirname + '/../assets/test_does_not_exist.json');
  t.type(config, "null");
  t.end();
});