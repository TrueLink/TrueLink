    "use strict";
    import modules = require("modules");
    import invariant = require("invariant");

    var exp = {
        getInitialState: function () {
            invariant(this.props.pageModel && this.props.pageModel.model,
                "props.pageModel and props.pageModel.model must be set");
            var pageModel = this.props.pageModel;
            return this._getState(pageModel, pageModel.model);
        },
        _getState: function (pageModel, model) {
            return {
                pageModel: pageModel,
                model: model
            };
        },
        _onModelChanged: function () {
            var pageModel = this.props.pageModel;
            this.setState(this._getState(pageModel, pageModel.model));
        },
        componentDidMount: function () {
            invariant(this.props.pageModel && this.props.pageModel.model,
                "props.pageModel and props.pageModel.model must be set");
            this.props.pageModel.on("changed", this._onModelChanged, this);
            this.props.pageModel.model.on("changed", this._onModelChanged, this);
        },
        componentWillUnmount: function () {
            invariant(this.props.pageModel && this.props.pageModel.model,
                "props.pageModel and props.pageModel.model must be set");
            this.props.pageModel.off("changed", this._onModelChanged, this);
            this.props.pageModel.model.off("changed", this._onModelChanged, this);
        }
    };
export = exp;
