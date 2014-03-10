define([
    "linkDb/LocalForageAdapter",
    "linkDb/versionControl",
    "linkDb/Entity",
    "interface/linkDb",
    "interface/linkDbCrypto",
    "sc_console"], function (LS, ver, Entity, lib, cryptoService, console) {
    "use strict";

    var when = lib.when;
    var extend = lib.extend;
    var async = lib.async;
    var whenAll = lib.whenAll;

    var adapter;

    function connect(dbName) {
        if (adapter) { return; }
        adapter = new LS(dbName || "db");
    }

    // encrypt/decrypt proxies
    function getDecryptedEntity(dbObj, overrideDecrypt) {
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
        return adapter.drop().then(function () { return true; });
    }

    var checkRevId = async(null, function (dfd, entity) {
        adapter.getById(entity.id, true).then(function (found) {
            if (found.revId === entity.revId) {
                dfd.resolve();
            } else {
                console.error(new Error("not a head revision of entity " + entity.id));
                dfd.reject({ error: "conflict", reason: "not a head revision" });
            }
        }, function (err) {
            if (err.error === "not_found") {
                dfd.resolve();
            } else {
                dfd.reject(err);
            }
        });
    });

    function save(entity, overrideEncrypt) {
        if (!entity.isDirty()) { return when(entity); }
        if (entity.isNew()) {entity.id = ver.createId(); }
        var checkPromise = checkRevId(entity);

        function saveEntity() {
            ver.prepareRevIds(entity);
            //entity.key = crypto.getKe
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

    function getById(id, overrideDecrypt) {
        return adapter.getById(id).then(function (found) {
            return when(getDecryptedEntity(found, overrideDecrypt));
        });
    }

    function getAllById(id, overrideDecrypt) {
        return adapter.getAllById(id).then(function (foundArr) {
            return whenAll(foundArr.map(function (found) {
                return getDecryptedEntity(found, overrideDecrypt);
            }));
        });
    }

    function getLinkedFrom(entity, linkType) {
        var promise = adapter.getLinksFrom(entity.id, linkType).then(function (links) {
            return whenAll(links.map(function (link) {
                return getById(link.toId);
            }));
        });
        return when(promise);
    }

    function getLinkedTo(entity, linkType) {
        var promise = adapter.getLinksTo(entity.id, linkType).then(function (links) {
            return whenAll(links.map(function (link) {
                return getById(link.fromId);
            }));
        });
        return when(promise);
    }

    function addLink(entityFrom, entityTo, linkType, isDeleted) {
        return adapter.getLink(entityFrom.id, entityTo.id, linkType).then(function (link) {
            if (link && !isDeleted) { return link; }
            if (!link && isDeleted) { return; }
            entityFrom.makeDirty();
            var newRevPromise = when(save(entityFrom));
            return newRevPromise.then(function () {
                return adapter.addLink(entityFrom.revId, entityFrom.id, entityTo.id, linkType, isDeleted);
            });
        });
    }

    function deleteLink(entityFrom, entityTo, linkType) {
        return addLink(entityFrom, entityTo, linkType, true);
    }

    function getAllLinks() {
        return adapter.getAllLinks();
    }
    function getAllEntities() {
        return adapter.getAllEntities();
    }
    function setAllLinks(links) {
        return adapter.setAllLinks(links);
    }
    function setAllEntities(entities) {
        return adapter.setAllEntities(entities);
    }

    return {
        connect: connect,
        drop: drop,
        save: save,
        getById: getById,
        getAllById: getAllById,
        addLink: addLink,
        deleteLink: deleteLink,
        getLinkedFrom: getLinkedFrom,
        getLinkedTo: getLinkedTo,
        getAllLinks: getAllLinks,
        getAllEntities: getAllEntities,
        setAllLinks: setAllLinks,
        setAllEntities: setAllEntities
    };
});