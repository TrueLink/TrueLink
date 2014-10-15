// patchConfig.js

var fs = require("fs");
var exec = require('child_process').exec;

function patch(){
	exec('hg id -i > rev.txt', function (err, stdout, stderr) {
		var hr = fs.readFileSync("rev.txt").toString().trim();
		var date = new Date();
		var mm = (date.getMonth() + 1).toString();
		var dd = date.getDate().toString();
		if (mm.length < 2) mm = "0" + mm;
		if (dd.length < 2) dd = "0" + dd;

        var config = fs.readFileSync("lib/config.js").toString().replace("__DAY__", dd).replace("__MONTH__", mm).replace("__HG_REV__", hr);
        fs.writeFileSync("lib/config_p.js", config);
        console.log("config patched");
    });
}

patch();