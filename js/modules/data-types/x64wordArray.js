define(["modules/data-types/multivalue", "modules/crypto-js/x64wordArray"], function (createType, WordArray){
	"use strict";
	var X64WordArray = function (arr, sigBytes){
		var arrValues = arr.map(function (item){return item.value});
		this.value = WordArray.create(arrValues, sigBytes);
	};
	return createType(X64WordArray, "x64wordArray");
});