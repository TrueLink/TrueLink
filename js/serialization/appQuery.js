define(function (require, exports, module) {
    "use strict";
    module.exports = {
        menu: {},
        profiles: [{
            contacts: [{
                tlConnection: {
                    _initialTlecBuilder: {
                        _tlkeBuilder: {
                            _tlke: {},
                            _route: {}
                        },
                        _tlhtBuilder: {
                            _tlht: {},
                            _route: {}
                        },
                        _tlec: {},
                        _route: {}
                    },
                    _tlecBuilders: [{
                        _tlkeBuilder: {
                            _tlke: {},
                            _route: {}
                        },
                        _tlhtBuilder: {
                            _tlht: {},
                            _route: {}
                        },
                        _tlec: {},
                        _route: {}
                    }]
                }
            }],
            documents: [{}],
            dialogs: [{
                contacts: [{}]
            }]
        }],
        currentProfile: {},
        transport: {},
        random: {},
        router: {
            pageModel: {
                model: {}
            }
        }
    };
});