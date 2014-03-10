var connect = require('connect');
var app = connect()
    .use(function (req, res, next) {
        "use strict";
	console.log(req.method + " " + req.url);
        try {
            if (req.url.indexOf(".appcache") !== -1) {
                res.setHeader("Content-Type", "text/cache-manifest");
            }
            if (req.url.indexOf("assets/") !== -1) {
                //Cache-Control "max-age=290304000, no-transform, public"
                //Expires "Tue, 20 Jan 2037 04:20:42 GMT"
                // etag off
            }
        } finally {
            next();
        }
    })
    .use(connect.static(__dirname));
var port = 8010;
connect.createServer(app).listen(port);
console.log("server started at http://localhost:"+port);