exports.crypto = require("./converters/crypto-js");
exports.custom = require("./converters/customTypes");
exports.sjcl = require("./converters/sjcl");
exports.forge = require("./converters/forge");
function register() {
    exports.crypto.register();
    exports.custom.register();
    exports.sjcl.register();
    exports.forge.register();
}
exports.register = register;
