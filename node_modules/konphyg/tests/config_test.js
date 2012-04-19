var konphyg = require('../.')(__dirname + '/../assets/config');

var test = require('tap').test;

test("load existing configuration with one file", function(t) {
  var config = konphyg('test1');
  t.similar(config, {a:100,b:{c:120,d:13}}, "wrong file contents");
  t.end();
});

test("non-existing base configuration file throws error", function(t) {
  var threw = false;
  
  try {
    var config = konphyg('test2');
  } catch(err) {
    threw = true
    t.equal(err.message, 'Could not find configuration file for test2 domain')
  }
  
  t.ok(threw, "should throw when base file is not found");
  t.end();
});