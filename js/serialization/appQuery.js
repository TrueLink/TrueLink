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
                    tlhtBuilder: {},
                    tlecBuilders: [{}]
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