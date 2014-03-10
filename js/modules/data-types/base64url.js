define(["modules/data-types/multivalue"], function (createType){
	"use strict";
	var Base64StringUrl = function (string){
		this.value = string;
	};
	return createType(Base64StringUrl, "base64url");
});