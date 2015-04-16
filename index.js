/*!
* VidStreamer.js
*
* Copyright (c) 2012 Andrew Weeks http://meloncholy.com
* Licensed under the MIT licence. See http://meloncholy.com/licence
* Version 0.1.4
*/

"use strict";

var fs = require("fs");
var url = require("url");
var events = require("events");
var settings = require('./config/vidStreamer-sample.json');
var Throttle = require('throttle');

var handler = new events.EventEmitter();

// Stuff to serve. Don't add null or "null" to the list (".null" should be fine) as the regex extension check will fail and you'll have a big security hole. And obviously don't add .js, .php or anything else you don't want to serve as source either.
var mimeTypes = {
	".swf": "application/x-shockwave-flash",
	".flv": "video/x-flv",
	".f4v": "video/mp4",
	".f4p": "video/mp4",
	".mp4": "video/mp4",
	".asf": "video/x-ms-asf",
	".asr": "video/x-ms-asf",
	".asx": "video/x-ms-asf",
	".avi": "video/x-msvideo",
	".mpa": "video/mpeg",
	".mpe": "video/mpeg",
	".mpeg": "video/mpeg",
	".mpg": "video/mpeg",
	".mpv2": "video/mpeg",
	".mov": "video/quicktime",
	".movie": "video/x-sgi-movie",
	".mp2": "video/mpeg",
	".qt": "video/quicktime",
	".mp3": "audio/mpeg",
	".wav": "audio/x-wav",
	".aif": "audio/x-aiff",
	".aifc": "audio/x-aiff",
	".aiff": "audio/x-aiff",
	".jpe": "image/jpeg",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".png" : "image/png",
	".svg": "image/svg+xml",
	".tif": "image/tiff",
	".tiff": "image/tiff",
	".gif": "image/gif",
	".txt": "text/plain",
	".xml": "text/xml",
	".css": "text/css",
	".htm": "text/html",
	".html": "text/html",
	".pdf": "application/pdf",
	".doc": "application/msword",
	".vcf": "text/x-vcard",
	".vrml": "x-world/x-vrml",
	".zip": "application/zip",
	".webm": "video/webm",
	".m3u8": "application/x-mpegurl",
	".ts": "video/mp2t",
	".ogg": "video/ogg"
};

var vidStreamer = function (req, res) {
	var stream;
	var stat;
	var info = {};
	var ext;
	var range = typeof req.headers.range === "string" ? req.headers.range : undefined;
	var reqUrl = url.parse(req.url, true);

	info.path = typeof reqUrl.pathname === "string" ? reqUrl.pathname.substring(1) : undefined;
	
	if (info.path) {
		try {
			info.path = decodeURIComponent(info.path);
		} catch (exception) {
			// Can throw URI malformed exception.
			handler.emit("badRequest", res);
			return false;
		}
	}

	// Security checks. Word.
	if (!info.path) {
		handler.emit("badFile", res);
		return false;
	} else if (info.path.search(/^\.\.?|^\/|^\\/) !== -1) {
		handler.emit("security", res, { message: info.path });
		return false;
	} else if (info.path.substring(0, settings.rootPath.length) !== settings.rootPath) {
		// This will trigger if wrong slashes are used. Change?
		handler.emit("security", res, { message: info.path });
		return false;
	} else {
		ext = info.path.match(/.*(\..+?)$/);

		if (ext === null || ext.length !== 2 || (info.mime = mimeTypes[ext[1].toLowerCase()]) === undefined) {
			handler.emit("badMime", res, { message: info.path });
			return false;
		}
	}

	info.path = info.path.substring(settings.rootPath.length);
	info.file = info.path.match(/(.*[\/|\\])?(.+?)$/)[2];

	// Want that file or a consisten-but-random one instead (for demos)?
	if (settings.random) {
		if (!randomFile(info)) {
			handler.emit("noRandomFiles", res, { message: info.path });
			return false;
		}
	} else {
		info.path = settings.rootFolder + info.path;
	}

	try {
		stat = fs.statSync(info.path);

		if (!stat.isFile()) {
			handler.emit("badFile", res);
			return false;
		}
	} catch (e) {
		handler.emit("badFile", res, e);
		return false;
	}

	info.start = 0;
	info.end = stat.size - 1;
	info.size = stat.size;
	info.modified = stat.mtime;
	info.rangeRequest = false;

	if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
		// Check range contains numbers and they fit in the file.
		// Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
		info.start = isNumber(range[1]) && range[1] >= 0 && range[1] < info.end ? range[1] - 0 : info.start;
		info.end = isNumber(range[2]) && range[2] > info.start && range[2] <= info.end ? range[2] - 0 : info.end;
		info.rangeRequest = true;
	} else if (reqUrl.query.start || reqUrl.query.end) {
		// This is a range request, but doesn't get range headers. So there.
		info.start = isNumber(reqUrl.query.start) && reqUrl.query.start >= 0 && reqUrl.query.start < info.end ? reqUrl.query.start - 0 : info.start;
		info.end = isNumber(reqUrl.query.end) && reqUrl.query.end > info.start && reqUrl.query.end <= info.end ? reqUrl.query.end - 0 : info.end;
	}

	info.length = info.end - info.start + 1;

	downloadHeader(res, info);

	// Flash vids seem to need this on the front, even if they start part way through. (JW Player does anyway.)
	if (info.start > 0 && info.mime === "video/x-flv") {
		res.write("FLV" + pack("CCNN", 1, 5, 9, 9));
	}
	stream = fs.createReadStream(info.path, { flags: "r", start: info.start, end: info.end });

	if (settings.throttle) {
		stream = stream.pipe(new Throttle(settings.throttle))
	}

	stream.pipe(res);
	return true;
};

vidStreamer.settings = function (s) {
	for (var prop in s) { settings[prop] = s[prop]; }
	return vidStreamer;
};

var randomFile = function (info) {
	var fileCode = 0;
	var fileParts;
	var randomSource;
	var randomPath;
	var randomFiles;
	var extn = info.path.match(/\..+?$/);

	// No extension given
	if (extn === null) return false;
	extn = extn[0];

	// See if there's a path
	fileParts = info.path.match(/(.*[\/|\\])?(.+?)$/);
	if (fileParts[1] === undefined) {
		randomPath = settings.rootFolder;
		randomSource = info.path;
	} else {
		randomPath = settings.rootFolder + fileParts[1];
		randomSource = fileParts[2];
	}

	if (randomPath.substr(-1) !== "/" && randomPath.substr(-1) !== "\\") randomPath += "/";

	for (var i = 0, len = randomSource.length; i < len; i++) {
		fileCode += randomSource.charCodeAt(i);
	}

	try {
		randomFiles = fs.readdirSync(randomPath);
	} catch (e) {
		return false;
	}
	randomFiles = randomFiles.filter(function (el) { return el.substr(-extn.length) === extn; });
	if (randomFiles.length === 0) return false;
	info.path = randomPath + randomFiles[fileCode % randomFiles.length];
	return true;
};

var downloadHeader = function (res, info) {
	var code = 200;
	var header;

	// 'Connection':'close',
	// 'Cache-Control':'private',
	// 'Transfer-Encoding':'chunked'

	if (settings.forceDownload) {
		header = {
			Expires: 0,
			"Cache-Control": "must-revalidate, post-check=0, pre-check=0",
			//"Cache-Control": "private",
			"Content-Type": info.mime,
			"Content-Disposition": "attachment; filename=" + info.file + ";"
		};
	} else {
		header = {
			"Cache-Control": "public; max-age=" + settings.maxAge,
			Connection: "keep-alive",
			"Content-Type": info.mime,
			"Content-Disposition": "inline; filename=" + info.file + ";",
			"Accept-Ranges": "bytes"
		};

		if (info.rangeRequest) {
			// Partial http response
			code = 206;
			header.Status = "206 Partial Content";
			header["Content-Range"] = "bytes " + info.start + "-" + info.end + "/" + info.size;
		}
	}

	header.Pragma = "public";
	header["Last-Modified"] = info.modified.toUTCString();
	header["Content-Transfer-Encoding"] = "binary";
	header["Content-Length"] = info.length;
    if(settings.cors){
        header["Access-Control-Allow-Origin"] = "*";
        header["Access-Control-Allow-Headers"] = "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept";
    }
    header.Server = settings.server;
	header.Server = settings.server;
	
	res.writeHead(code, header);
};

var errorHeader = function (res, code) {
	var header = {
		"Content-Type": "text/html",
		Server: settings.server
	};

	res.writeHead(code, header);
};

// http://stackoverflow.com/a/1830844/648802
var isNumber = function (n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

// A tiny subset of http://phpjs.org/functions/pack:880
var pack = function (format) {
	var result = "";

	for (var pos = 1, len = arguments.length; pos < len; pos++) {
		if (format[pos - 1] == "N") {
			result += String.fromCharCode(arguments[pos] >> 24 & 0xFF);
			result += String.fromCharCode(arguments[pos] >> 16 & 0xFF);
			result += String.fromCharCode(arguments[pos] >> 8 & 0xFF);
			result += String.fromCharCode(arguments[pos] & 0xFF);
		} else {
			result += String.fromCharCode(arguments[pos]);
		}
	}

	return result;
};

handler.on("badFile", function (res, e) {
	errorHeader(res, 404);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>404 Not found</title></head>" +
		"<body>" +
		"<h1>Ooh dear</h1>" +
		"<p>Sorry, I can't find that file. Could you check again?</p>" +
		"</body></html>");
	console.error("404 Bad File - " + (e ? e.message : ""));
});

handler.on("badRange", function (res, e) {
	errorHeader(res, 416);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>416 Range not satisifiable</title></head>" +
		"<body>" +
		"<h1>Ooh dear</h1>" +
		"<p>Sorry, the file isn't that big. Maybe try asking for a bit before the end of the file?</p>" +
		"</body></html>");
	console.error("416 Bad Range - " + (e ? e.message : ""));
});

handler.on("security", function (res, e) {
	errorHeader(res, 403);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>403 Forbidden</title></head>" +
		"<body>" +
		"<h1>Hey!</h1>" +
		"<p>Stop trying to hack my server!</p>" +
		"</body></html>");
	console.error("403 Security - " + (e ? e.message : ""));
});

handler.on("badMime", function (res, e) {
	errorHeader(res, 403);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>403 Forbidden</title></head>" +
		"<body>" +
		"<h1>Sorry&hellip;</h1>" +
		"<p>You're not allowed to download files of that type.</p>" +
		"</body></html>");
	console.error("403 Bad MIME - " + (e ? e.message : ""));
});

handler.on("badRequest", function (res, e) {
	errorHeader(res, 400);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>400 Bad request</title></head>" +
		"<body>" +
		"<h1>Wut?</h1>" +
		"<p>I couldn't understand that I'm afraid; the syntax appears malformed.</p>" +
		"</body></html>");
	console.error("400 Bad Request - " + (e ? e.message : ""));
});

handler.on("noRandomFiles", function (res, e) {
	errorHeader(res, 404);
	res.end("<!DOCTYPE html><html lang=\"en\">" +
		"<head><title>404 Not found</title></head>" +
		"<body>" +
		"<h1>Sorry&hellip;</h1>" +
		"<p>There don't appear to be any files of that type at all there.</p>" +
		"</body></html>");
	console.error("404 No Random Files - " + (e ? e.message : ""));
});

/*process.on('uncaughtException', function(e) {
	util.debug(e);
});*/

module.exports = vidStreamer;
