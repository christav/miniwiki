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

(function () {

	// A reusable "match failed" result
	var failedResult = { matched: false, consumed: 0 };


	function any(input) {
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

	function matchString(stringToMatch) {
		// A parser generator function - returns a parser function that matches the
		// supplied string
		var matchLength = stringToMatch.length;
		return function (input) {
			var inputSubstring;
			if (input.text.length - input.index >= matchLength) {
				inputSubstring = input.text.substr(input.index, matchLength);
				if (inputSubstring === stringToMatch) {
					return {
						matched: true,
						text: inputSubstring,
						consumed: matchLength,
						result: null
					}
				}
			}
			return failedResult;
		}
	}

	function not (parser) {
		// Parser generator that returns a new parser that matches if the passed in
		// parser does NOT match. Does not consume any input.
		return function (input) {
			var result = parser(input);
			if (result.matched) {
				return failedResult;
			}
			return {
				matched: true,
				text: "",
				consumed: 0,
				result: null
			};
		}
	}

	exports.any = any;
	exports.not = not;
	exports.matchString = matchString;
})();