define(["modules/data-types/multivalue", "modules/crypto-js/x64word"], function (createType, Word){
	"use strict";
	var X64Word = function (high, low){
		this.value = Word.create(high, low);
	};
	return createType(X64Word, "x32wordArray");
});