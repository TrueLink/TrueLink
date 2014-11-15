
    "use strict";
    var forge = require("node-forge");
    var BigIntForge = require("Multivalue/multivalue/bigIntForge");
    var ByteBuffer = require("Multivalue/multivalue/byteBuffer");
    var Hex = require("Multivalue/multivalue/hex");

    var invariant = require("invariant");

    function extend(dst, src) {
        var key;
        for (key in Object.keys(src)) {
            dst[key] = src[key];
        }
    }

    // __________________________________________________________________________ //

    function PublicKey(key) {
        this._key = key;
    }

    PublicKey.prototype.isEqualTo = function (other) {
        if (!(other instanceof PublicKey)) {
            return false;
        }
        if (this.constructor !== other.constructor) { 
            return false; 
        }
        if (!this.n.isEqualTo(other.n)) return false;
        if (!this.e.isEqualTo(other.e)) return false;
        return true;
    }

    PublicKey.prototype.serialize = function() {
        return {
            n: this.n.as(Hex).serialize(),
            e: this.e.as(Hex).serialize(),
        }
    }

    PublicKey.prototype.verify = function(data, signature) {
        var md = forge.md.sha1.create();
        md.update(data, 'utf8');
        var bytes = md.digest().bytes();
        var raw = signature.as(ByteBuffer).value.copy();
        return this._key.verify(bytes, raw.data);
    }

    PublicKey.prototype.encrypt = function(data, scheme, options) {
        var source = data.as(ByteBuffer).value.copy();
        var encrypted = this._key.encrypt(source.data, scheme, options);
        return new ByteBuffer(encrypted);
    }

    PublicKey.deserialize = function(dto) {
        var n = new Hex.deserialize(dto.n).as(BigIntForge).value;
        var e = new Hex.deserialize(dto.e).as(BigIntForge).value;
        var internalKey = forge.rsa.setPublicKey(n, e);
        return new PublicKey(internalKey);
    }

    Object.defineProperty(PublicKey.prototype, "n", {
        get: function() {
            return new BigIntForge(this._key.n);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PublicKey.prototype, "e", {
        get: function() {
            return new BigIntForge(this._key.e);
        },
        enumerable: true,
        configurable: true
    });

    // __________________________________________________________________________ //

    function PrivateKey(key) {
        this._key = key;
    }

    PrivateKey.prototype.isEqualTo = function (other) {
        if (!(other instanceof PrivateKey)) {
            return false;
        }
        if (this.constructor !== other.constructor) { 
            return false; 
        }
        if (!this.n.isEqualTo(other.n)) return false;
        if (!this.e.isEqualTo(other.e)) return false;
        if (!this.d.isEqualTo(other.d)) return false;
        if (!this.p.isEqualTo(other.p)) return false;
        if (!this.q.isEqualTo(other.q)) return false;
        if (!this.dP.isEqualTo(other.dP)) return false;
        if (!this.dQ.isEqualTo(other.dQ)) return false;
        if (!this.qInv.isEqualTo(other.qInv)) return false;
        return true;
    }

    PrivateKey.prototype.serialize = function() {
        return {
            n: this.n.as(Hex).serialize(),
            e: this.e.as(Hex).serialize(),
            d: this.d.as(Hex).serialize(),
            p: this.p.as(Hex).serialize(),
            q: this.q.as(Hex).serialize(),
            dP: this.dP.as(Hex).serialize(),
            dQ: this.dQ.as(Hex).serialize(),
            qInv: this.qInv.as(Hex).serialize(),
        }
    }

    PrivateKey.prototype.sign = function(data) {
        var md = forge.md.sha1.create();
        md.update(data, 'utf8');
        return new ByteBuffer(this._key.sign(md));
    }

    PrivateKey.prototype.decrypt = function(data, scheme, options) {
        var source = data.as(ByteBuffer).value.copy();
        var decrypted = this._key.decrypt(source.data, scheme, options);
        return new ByteBuffer(decrypted);
    }

    PrivateKey.deserialize = function(dto) {
        var n = new Hex.deserialize(dto.n).as(BigIntForge).value;
        var e = new Hex.deserialize(dto.e).as(BigIntForge).value;
        var d = new Hex.deserialize(dto.d).as(BigIntForge).value;
        var p = new Hex.deserialize(dto.p).as(BigIntForge).value;
        var q = new Hex.deserialize(dto.q).as(BigIntForge).value;
        var dP = new Hex.deserialize(dto.dP).as(BigIntForge).value;
        var dQ = new Hex.deserialize(dto.dQ).as(BigIntForge).value;
        var qInv = new Hex.deserialize(dto.qInv).as(BigIntForge).value;
        return new PrivateKey(forge.rsa.setPrivateKey(n, e, d, p, q, dP, dQ, qInv));
    }

    Object.defineProperty(PrivateKey.prototype, "n", {
        get: function() {
            return new BigIntForge(this._key.n);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "e", {
        get: function() {
            return new BigIntForge(this._key.e);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "d", {
        get: function() {
            return new BigIntForge(this._key.d);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "p", {
        get: function() {
            return new BigIntForge(this._key.p);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "q", {
        get: function() {
            return new BigIntForge(this._key.q);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "dP", {
        get: function() {
            return new BigIntForge(this._key.dP);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "dQ", {
        get: function() {
            return new BigIntForge(this._key.dQ);
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(PrivateKey.prototype, "qInv", {
        get: function() {
            return new BigIntForge(this._key.qInv);
        },
        enumerable: true,
        configurable: true
    });

    // __________________________________________________________________________ //

    function generateKeyPair(options, callback) {
        if (callback) {
            forge.rsa.generateKeyPair(options, function(err, keypair) {
                if (err) {
                    callback(err, keypair);
                } else {
                    callback(err, {
                        publicKey: new PublicKey(keypair.publicKey),
                        privateKey: new PrivateKey(keypair.privateKey)
                    });
                }
            });
        } else {
            var keypair = forge.rsa.generateKeyPair(options);
            return {
                publicKey: new PublicKey(keypair.publicKey),
                privateKey: new PrivateKey(keypair.privateKey)
            };
        }
    }

    function getPublicKeyFingerprint(publicKey) {
        invariant(publicKey instanceof PublicKey, "invalid publicKey");
        var fp = forge.ssh.getPublicKeyFingerprint(publicKey._key);
        return new ByteBuffer(fp); 
    }

    exports.PublicKey = PublicKey;
    exports.PrivateKey = PrivateKey;
    exports.generateKeyPair = generateKeyPair;
    exports.getPublicKeyFingerprint = getPublicKeyFingerprint;
