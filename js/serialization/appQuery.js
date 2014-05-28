define(function (require, exports, module) {
    "use strict";
    module.exports = {
        menu: {},
        profiles: [{
            contacts: [{
                tlConnection: {
                    tlkeBuilder: {
                        _tlke: {},
                        _route: {}
                    },
                    tlhtBuilder: {
                        _tlht: {},
                        _route: {}
                    },
                    tlecBuilders: [{
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
            model: {}
        }
    };
});