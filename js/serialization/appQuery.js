define(function (require, exports, module) {
    "use strict";
    module.exports = {

        Application: {
            // key is a link name
            // propType may be smth like "lazyLoadingMany" in future
            // type is a definition name within this query, not a class name
            // type "any" means that the corresponding model must be already deserialized
            // (see SerializationContext.deserialize() without constructor argument)
            menu: {propType: "one", type: "Menu"},
            transport: {propType: "one", type: "TestTransport"},
            profiles: {propType: "many", type: "Profile"},
            currentProfile: {propType: "one", type: "Profile"},
            router: {propType: "one", type: "Router"},
            random: {propType: "one", type: "Random"}
        },
        Profile: {
            tlConnections: {propType: "many", type: "TlConnection"},
            contacts: {propType: "many", type: "Contact"},
            documents: {propType: "many", type: "Document"},
            dialogs: {propType: "many", type: "Dialog"}
        },
        TlConnection: {
            _initialTlecBuilder: {propType: "one", type: "TlecBuilder"},
            _tlecBuilders: {propType: "many", type: "TlecBuilder"}
        },
        TlecBuilder: {
            _tlkeBuilder: {propType: "one", type: "TlkeBuilder"},
            _tlhtBuilder: {propType: "one", type: "TlhtBuilder"},
            _tlec: {propType: "one", type: "Tlec"},
            _route: {propType: "one", type: "Route"}
        },
        TlhtBuilder: {
            _tlht: {propType: "one", type: "Tlht"},
            _route: {propType: "one", type: "Route"}
        },
        TlkeBuilder: {
            _tlke: {propType: "one", type: "Tlke"},
            _route: {propType: "one", type: "Route"}
        },
        Route: {},
        Tlec: {},
        Tlht: {},
        Tlke: {},
        Dialog: {
            contacts: {propType: "many", type: "Contact"}
        },
        Menu: {},
        Document: {},
        Contact: {
            tlConnection: {propType: "one", type: "TlConnection"}
        },
        Router: {
            pageModel: {propType: "one", type: "PageModel"}
        },
        PageModel: {
            model: {propType: "one", type: "any"}
        },
        TestTransport: {},
        Random: {}
    };
});