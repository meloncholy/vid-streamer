# konphyg

Cascading configuration files made easy in Node.js.

# Install

    $ npm install konphyg

# Usage

Place your configuration files inside a dir (you can name it "config" for convention).

These should be JSON files, terminated by ".json".

This example loads and parses the ../config/redis.json file:

    // Initialize konphyg with the base config dir
    var config = require('konphyg')(__dirname + '../config');

    // Read the "redis" domain
    var redisConfig = config('redis');

## Environment-specific files and cascading

Inside the configuration dir you can have many files for each configuration set.

For instance, you can have a `redis.json`, which will work by default and a `redis.test.json` which will be loaded when the environment variable NODE_ENV is 'test'.

The base `redis.json` values can be overrided by the more specific `redis.test.json` one.

What happens here is that the settings in the base configuration are merged with the `redis.test.json` one (using deep merge), so you only have to place the differences inside the environment-specific file.

# Examples

For instance let's say you have this `redis.json` file:

    {
        "host": "redis.acme.com"
      , "port": "6379"
    }

and that you have this `redis.development.json` file:

    {
      "host": "127.0.0.1"
    }

The resulting configuration for the development environment will be the merge of the 2:

    {
        "host": "127.0.0.1"
      , "port": "6379"
    }


This also works with attributes nested at any level.

## NODE_ENV defaults

If not present, the chosen environment is 'development'.

If you want to launch a node process using the 'production' environment you should then do something like:


    $ NODE_ENV=production node app.js

# Resources

* [Configuration files in Node.js made easy with Konphyg](http://metaduck.com/post/10514524808/configuration-files-in-node-js-made-easy-with-konphyg)