exports.crypto = require("./converters/crypto-js");
exports.custom = require("./converters/customTypes");
exports.sjcl = require("./converters/sjcl");
function register() {
    exports.crypto.register();
    exports.custom.register();
    exports.sjcl.register();
}
exports.register = register;
