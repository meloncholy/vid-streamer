VidStreamer.js
==============

VidStreamer.js: A simple streamer for Flash and other videos (and other files too). Supports HTTP pseudostreaming and works with JW Player&#39;s bitrate switching.

To make a standalone video streamer, try something like this

```javascript
var http = require("http");
var vidStreamer = require("vid-streamer");

var app = http.createServer(vidStreamer);
app.listen(3000);
console.log("VidStreamer.js up and running on port 3000");
```

And here's an example of including it in an Express app

```javascript
var app = require("express").createServer();
var vidStreamer = require("vid-streamer");

app.get("/videos/", vidStreamer);

app.listen(3000);
```

If you want to pass in the settings instead via your app, try this (thanks to [Will Laurance](https://github.com/meloncholy/vid-streamer/issues/3)). Settings given will be merged with the defaults (see below), so you don't need to supply them all.

```javascript
var http = require("http");
var vidStreamer = require("vid-streamer");

var newSettings = {
	rootPath: "download-clips/",
	forceDownload: true
}

var app = http.createServer(vidStreamer.settings(newSettings));
app.listen(3000);
```

Installation
------------

You should be able to get it via `npm install vid-streamer`, or otherwise through Git of course. 

Settings
--------

There are a few things to twiddle in `/config/vidStreamer.json`. (Please rename `vidStreamer-sample.json`.)

- **mode** - Not actually used right now. :)
- **forceDownload** - Tell the browser to show a save file dialog.
- **random** - Show a random file instead of the one named (see below).
- **rootFolder** - The root folder from which files are returned. Accessing subfolders is possible by putting them in the path. 
- **rootPath** - The path assumed to match up with the root folder. 
- **server** - Server string returned in the header.
- **throttle** - Allows you to [throttle](https://github.com/TooTallNate/node-throttle#node-throttle) (limit) server bandwidth (bytes/second), cool for dev where

Standalone example

```javascript
{
	"mode": "development",
	"forceDownload": false,
	"random": false,
	"rootFolder": "/path/to/videos/",
	"rootPath": "videos/",
	"server": "VidStreamer.js/0.1.4"
}
```

Example for Express. (Note that rootPath should be relative to the root URL of your Express app.)

```javascript
{
	"mode": "development",
	"forceDownload": false,
	"random": false,
	"rootFolder": "/path/to/express/public/",
	"rootPath": "",
	"server": "VidStreamer.js/0.1.4"
}
```

Serving random files
--------------------

You can use VidStreamer to serve up random files instead of the actual file requested. This can be useful if you're demoing an app that's supposed to have hundreds of videos but you don't want to go to the trouble of making them all. 

- Which file to return is calculated from the requested file name, so the same one will be returned each time for the same name. This is useful if you want to switch between video bitrates for example. 
- The file returned will be of the same type (same extension) as the requested file.
- The file returned will be from the same folder as the requested file.


Thanks
------

I hadn't really thought about how to write video streamer before, so [Devendra Tewari's post](http://delog.wordpress.com/2011/04/25/stream-webm-file-to-chrome-using-node-js/) and the [xmoovStream Server](http://stream.xmoov.com/) source were very useful to me. 


Legal fun
---------

Copyright &copy; 2012 Andrew Weeks http://meloncholy.com

VidStreamer.js is licensed under the [MIT licence](http://meloncholy.com/licence/).


Me
--
I have [a website](http://meloncholy.com) and a [Twitter thingy](https://twitter.com/meloncholy). Please come and say hi if you'd like; be lovely to hear from you. 
