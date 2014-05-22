define(function (require, exports, module) {
    "use strict";
    module.exports = {
        menu: {},
        profiles: [{
            contacts: [{}],
            documents: [{}],
            dialogs: [{
                contacts: [{}]
            }]
        }],
        currentProfile: {},
        transport: {},
        router: {
            model: {}
        }
    };
});