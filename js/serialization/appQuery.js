define(function (require, exports, module) {
    "use strict";
    module.exports = {
        menu: {},
        profiles: [{
            contacts: [{
                tlConnection: {
                    tlkeBuilder: {
                        tlke: {},
                        route: {}
                    },
                    tlhtBuilder: {
                        tlht: {},
                        route: {}
                    },
                    tlecBuilders: [{
                        tlec: {},
                        route: {}
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