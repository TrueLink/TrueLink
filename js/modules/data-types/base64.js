define(["modules/data-types/multivalue"], function (createType){
	"use strict";
	var Base64String = function (string){
		this.value = string;
	};
	return createType(Base64String, "base64")
});