"use strict";

function DecryptionFailedError(innerError) {
    this.innerError = innerError;
}

module.exports = DecryptionFailedError;