// Helper library for implementing PEG parsers

//
// PEG - Parsing Expression Grammars
// A helper library for implementing parsers
//
// Form of a parser: function (input) -> parseResult
//
// Input is an object of the form:
// {
//	    text: "Full string to parse",
//		index: indexToStartParsing
// }
//
// parseResult is an object of the form:
//
// {
//		matched: boolean true if parse matched, false if it didn't
//      text: If matched, this is the string that was matched
//      consumed: numberOfCharactersConsumedByTheParse
//		result: "optional object carrying extra parse information"
// }
//

_ = require("underscore");

(function () {

	// A reusable "match failed" result
	var failedResult = { matched: false, consumed: 0 };

	function matchedResult(parseResult, callback) {
		// helper function to pass result to callback, if any
		if (callback) {
			callback(parseResult);
		}
		return parseResult;
	}

	function anyParser(input) {
		// The '.' operator, matches any single character except end of string
		if (input.index < input.text.length) {
			return {
				matched: true,
				text: input.text.charAt(input.index),
				consumed: 1,
				result: null
			};
		} else {
			return failedResult;
		}
	}

	anyParser.then = function (callback) {
		return function (input) {
			var result = anyParser(input);
			if(result.matched) {
				callback(result);
			}
			return result;
		}
	}

	function any() {
		return anyParser;
	}

	function end(input, callback) {
		// parse function that matches the end of input
		if (input.index === input.text.length) {
			return matchedResult({
				matched: true,
				text: "",
				consumed: 0,
				result: null
			}, callback);
		}
		return failedResult;
	}

	function matchString(stringToMatch, callback) {
		// A parser generator function - returns a parser function that matches the
		// supplied string
		var matchLength = stringToMatch.length;
		return function (input) {
			var inputSubstring;
			if (input.text.length - input.index >= matchLength) {
				inputSubstring = input.text.substr(input.index, matchLength);
				if (inputSubstring === stringToMatch) {
					return matchedResult({
						matched: true,
						text: inputSubstring,
						consumed: matchLength,
						result: null
					}, callback);
				}
			}
			return failedResult;
		}
	}

	function matchRegex(regex, callback) {
		// A parser generator function that matches the given regex at the current
		// location in the text
		return function (input) {
			var matches = input.text.substring(input.index).match(regex);
			if (matches === null || matches.index !== 0) {
				return failedResult;
			}

			return matchedResult({
				matched: true,
				text: matches[0],
				consumed: matches[0].length,
				result: null
			}, callback);
		}
	}

	function match(stringOrRegex, callback) {
		// "overloaded" function that figures out wether to call
		// matchString or matchRegex based on the type passed in.
		if (_.isRegExp(stringOrRegex)) {
			return matchRegex(stringOrRegex, callback);
		}
		return matchString(stringOrRegex, callback);
	}

	function not (parser, callback) {
		// Parser generator that returns a new parser that matches if the passed in
		// parser does NOT match. Does not consume any input.
		return function (input) {
			var result = parser(input);
			if (result.matched) {
				return failedResult;
			}
			return matchedResult({
				matched: true,
				text: "",
				consumed: 0,
				result: null
			}, callback);
		}
	}

	function and(parser) {
		// Parser generator function that returns a new parser that matches
		// whatever the inner parser is, but does not consume any characters.
		// Implements the PEG & operator.
		return function (input) {
			var result = parser(input);
			if (result.matched) {
				return {
					matched: true,
					text: result.text,
					consumed: 0,
					result: result.result
				};
			}
			return result;
		}
	}

	_.extend(exports, {
		any: any,
		end: end,
		not: not,
		and: and,
		match: match
	});

})();