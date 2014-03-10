define(["modules/data-types/multivalue", "modules/crypto-js/x32wordArray"], function (createType, WordArray){
	"use strict";
	var X32WordArray = function (value, sigBytes){
		// create from words
		if(value instanceof Array){
			this.value = WordArray.create(value, sigBytes);
		}
		// create from another WordArray
		else{
			this.value = value;
		}
	};
	return createType(X32WordArray, "x32wordArray");
});