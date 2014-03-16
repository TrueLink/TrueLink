define([
    "linkDb/DbJsAdapter",
    "linkDb/versionControl",
    "linkDb/Entity",
    "linkDb/interface"], function (Adapter, ver, Entity, lib) {
    "use strict";

    var when = lib.when;
    var extend = lib.extend;
    var whenAll = lib.whenAll;
    var Promise = lib.Promise;

    var adapter, cryptoService;

    function connect(dbName) {
        if (adapter) { return; }
        adapter = new Adapter(dbName || "db");
    }

    // iEncryptor: {
    //   object decryptData(object encryptionInfo, object encryptedData)
    //   {object encryptionInfo, object encryptedData} encrypt(object dataToEncrypt)
    // }
    function setDefaultEncryptor(iEncryptor) {
        cryptoService = iEncryptor;
    }

    function assertReady(skipCrypto) {
        if (!adapter || (!cryptoService && !skipCrypto)) {
            throw new Error("Database is not configured");
        }
    }

    // encrypt/decrypt proxies
    function getDecryptedEntity(dbObj, overrideDecrypt) {
        if (dbObj === null) {
            return when(null);
        }
        var dataPromise;
        if (overrideDecrypt) {
            dataPromise = overrideDecrypt(dbObj.key, dbObj._protected);
        } else {
            dataPromise = cryptoService.decryptData(dbObj.key, dbObj._protected);
        }
        return when(dataPromise).then(function (decryptedData) {
            dbObj._protected = decryptedData;
            var entity = Entity.deserialize(dbObj);
            return entity;
        });
    }
    function getEncryptedObj(entity, overrideEncrypt) {
        var dbObj = entity.serialize();
        var storageDataPromise;
        if (overrideEncrypt) {
            storageDataPromise = overrideEncrypt(dbObj._protected);
        } else {
            storageDataPromise = cryptoService.encryptData(dbObj._protected);
        }
        return when(storageDataPromise).then(function (encrypted) {
            dbObj.key = encrypted.encryptionInfo;
            dbObj._protected = encrypted.encryptedData;
            return dbObj;
        });
    }

    function drop() {
        assertReady(true);
        return adapter.drop().then(function () { return true; });
    }


    var checkRevId = function (entity) {
        return Promise(function (resolve, reject) {
            // TODO temp solution
            if (!entity.revId) {
                resolve();
                return;
            }
            adapter.getById(entity.id, true).then(function (found) {
                if (!found) { resolve(); }
                if (found.revId === entity.revId) {
                    resolve();
                } else {
                    console.error(new Error("Not a head revision of entity " + entity.id));
                    reject({ error: "conflict", reason: "not a head revision" });
                }
            });
        });
    };

    function save(entity, overrideEncrypt) {
        assertReady(!!overrideEncrypt);
        if (!entity.isDirty()) { return when(entity); }
        var checkPromise = checkRevId(entity);

        function saveEntity() {
            ver.prepareRevIds(entity);
            var storObjPromise = getEncryptedObj(entity, overrideEncrypt);
            var savePromise = when(storObjPromise)
                .then(function (storObj) {
                    return adapter.put(storObj);
                })
                .then(function () {
                    entity.clean();
                    return when(entity);
                });
            return savePromise;
        }
        return checkPromise.then(saveEntity);
    }

    function getById(id, overrideDecrypt, since) {
        assertReady(!!overrideDecrypt);
        return adapter.getById(id).then(function (found) {
            return when(getDecryptedEntity(found, overrideDecrypt));
        });
    }

    function getLinksFrom(entity, linkType, since) {
        return adapter.getLinksFrom(entity.id, linkType);
    }

    function getLinksTo(entity, linkType, since) {
        return adapter.getLinksTo(entity.id, linkType);
    }

    function addLink(entityFrom, entityTo, linkType, isDeleted, createNewRev) {
        assertReady();
        var newRevPromise = when(entityFrom);
        if (createNewRev) {
            entityFrom.makeDirty();
            newRevPromise = save(entityFrom);
        }

        var getExisting = adapter.getLink(entityFrom.id, entityTo.id, linkType).then(function (existing) {
            if (existing && ((existing.isDeleted && isDeleted) || (!existing.isDeleted && !isDeleted))) {
                return existing;
            }
            return null;
        });

        return getExisting.then(function (existing) {
            if (existing) {
                return existing;
            }
            return newRevPromise.then(function (saved) {
                return adapter.addLink(saved.revId, saved.id, entityTo.id, linkType, isDeleted);
            });
        });
    }

    function deleteLink(entityFrom, entityTo, linkType, createNewRev) {
        assertReady();
        return addLink(entityFrom, entityTo, linkType, true, createNewRev);
    }

    function getAllLinks() {
        assertReady();
        return adapter.getAllLinks();
    }
    function getAllEntities() {
        assertReady();
        return adapter.getAllEntities();
    }
    function setAllLinks(links) {
        assertReady();
        return adapter.setAllLinks(links);
    }
    function setAllEntities(entities) {
        assertReady();
        return adapter.setAllEntities(entities);
    }

    return {
        connect: connect,
        setDefaultEncryptor: setDefaultEncryptor,
        drop: drop,
        save: save,
        getById: getById,
        addLink: addLink,
        deleteLink: deleteLink,
        getLinksFrom: getLinksFrom,
        getLinksTo: getLinksTo,
        getAllLinks: getAllLinks,
        getAllEntities: getAllEntities,
        setAllLinks: setAllLinks,
        setAllEntities: setAllEntities
    };
});