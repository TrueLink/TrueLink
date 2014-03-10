define(["modules/data-types/multivalue"], function (createType){
	"use strict";
	var Utf8String = function (string){
		this.value = string;
	};
	return createType(Utf8String, "utf8string");
});