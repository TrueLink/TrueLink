export import crypto = require("./converters/crypto-js");
export import custom = require("./converters/customTypes");
export import sjcl = require("./converters/sjcl");
export import forge = require("./converters/forge");

export function register() {
    crypto.register();
    custom.register();
    sjcl.register();
    forge.register();
}
