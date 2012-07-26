// Helper library for implementing PEG parsers

//
// PEG - Parsing Expression Grammars
// A helper library for implementing parsers
//
// Form of a parser: function (input) -> parseResult
//
// Input is an object of the form:
// {
//     text: "Full string to parse",
//     index: indexToStartParsing
// }
//
// parseResult is an object of the form:
//
// {
//     matched: boolean true if parse matched, false if it didn't
//     text: If matched, this is the string that was matched
//     consumed: numberOfCharactersConsumedByTheParse
//     result: "optional object carrying extra parse information"
// }
//

_ = require("underscore");

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

    function end(input) {
        // parse function that matches the end of input
        if (input.index === input.text.length) {
            return {
                matched: true,
                text: "",
                consumed: 0,
                result: null
            };
        }
        return failedResult;
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
                    };
                }
            }
            return failedResult;
        };
    }

    function matchRegex(regex) {
        // A parser generator function that matches the given regex at the current
        // location in the text
        return function (input) {
            var matches = input.text.substring(input.index).match(regex);
            if (matches === null || matches.index !== 0) {
                return failedResult;
            }

            return {
                matched: true,
                text: matches[0],
                consumed: matches[0].length,
                result: null
            };
        };
    }

    function match(stringOrRegex) {
        // "overloaded" function that figures out wether to call
        // matchString or matchRegex based on the type passed in.
        if (_.isRegExp(stringOrRegex)) {
            return matchRegex(stringOrRegex);
        }
        return matchString(stringOrRegex);
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
        };
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
                    data: result
                };
            }
            return result;
        };
    }

    function seq() {
        // sequence operator - returns a parser that matches all the parsers
        // passed in via arguments
        var parsers = Array.prototype.slice.call(arguments, 0);
        return function (input) {
            var currentInput
            var internalInput = {
                text: input.text,
                index: input.index
            };
            var results = [];
            var result;
            for(var i = 0, length = parsers.length; i < length; ++i) {
                result = parsers[i](internalInput);
                if(!result.matched) { return failedResult; }
                results.push(result);
                internalInput.index += result.consumed;
            }

            return {
                matched: true,
                text: input.text.substring(input.index, internalInput.index),
                consumed: internalInput.index - input.index,
                data: results
            };
        };
    }

    function firstOf() {
        // alternation operator - returns a parser that matches if any of
        // the subparsers match at the current index
        var parsers = Array.prototype.slice.call(arguments, 0);

        return function (input) {
            var result;
            for(var i = 0, length = parsers.length; i < length; ++i)
            {
                result = parsers[i](input);
                if(result.matched) {
                    return result;
                }
            };
            return failedResult;
        };
    }

    function zeroOrMore(parseFunction) {
        var zeroOrMoreFunction = function (input) {
            var internalInput = {
                text: input.text,
                index: input.index
            };
            var results = [];
            var result = parseFunction(internalInput);
            while(result.matched) {
                results.push(result);
                internalInput.index += result.consumed;
                result = parseFunction(internalInput);
            }
            return {
                matched: true,
                text: input.text.substring(input.index, internalInput.index),
                consumed: internalInput.index - input.index,
                data: results
            };
        };
        return zeroOrMoreFunction;
    }

    function oneOrMore(parseFunction) {
        var oneOrMoreFunction = function (input) {
            var internalInput = {
                text: input.text,
                index: input.index
            };
            var results = [];
            var result = parseFunction(internalInput);
            if(!result.matched) { return failedResult; }
            
            while(result.matched) { 
                results.push(result);
                internalInput.index += result.consumed;
                result = parseFunction(internalInput);
            }
            return {
                matched: true,
                text: input.text.substring(input.index, internalInput.index),
                consumed: internalInput.index - input.index,
                data: results
            };
        };
        return oneOrMoreFunction;
    }

    function onMatch(parser, callback) {
        return function (input) {
            var result = parser(input);
            if(result.matched) {
                callback(result);
            }
            return result;
        };
    }

    _.extend(exports, {
        any: any,
        end: end,
        not: not,
        and: and,
        match: match,
        seq: seq,
        firstOf: firstOf,
        zeroOrMore: zeroOrMore,
        oneOrMore: oneOrMore,
        onMatch: onMatch
    });

})();
