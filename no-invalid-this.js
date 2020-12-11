/**
 * @fileoverview A rule to disallow `this` keywords outside of classes or class-like objects.
 * @author Toru Nagashima
 * Mod by A_S: handle Node-specific event listener assignments.
 * stream.on('data', function(data) { this.end(); }); => OK
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

/* A_S: the path in "require" is changed so that rule could be used as a custom one.
  If rule is placed in main ESLint folder, this will work as well */
const astUtils = require("eslint/lib/rules/utils/ast-utils");
// const astUtils = require("./utils/ast-utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "disallow `this` keywords outside of classes or class-like objects",
            category: "Best Practices",
            recommended: false,
            url: "https://eslint.org/docs/rules/no-invalid-this"
        },

        schema: [
            {
                type: "object",
                properties: {
                    capIsConstructor: {
                        type: "boolean",
                        default: true
                    }
                },
                additionalProperties: false
            }
        ],

        messages: {
            unexpectedThisNode: "Unexpected 'this'."
        }
    },

    create(context) {
        const options = context.options[0] || {};
        const capIsConstructor = options.capIsConstructor !== false;
        const stack = [],
            sourceCode = context.getSourceCode();

        /**
         * Gets the current checking context.
         *
         * The return value has a flag that whether or not `this` keyword is valid.
         * The flag is initialized when got at the first time.
         * @returns {{valid: boolean}}
         *   an object which has a flag that whether or not `this` keyword is valid.
         */
        stack.getCurrent = function() {
            const current = this[this.length - 1];

            if (!current.init) {
                current.init = true;
                current.valid = !astUtils.isDefaultThisBinding(
                    current.node,
                    sourceCode,
                    { capIsConstructor }
                ) || isListener(current.node);
            }
            return current;
        };

        const listenersArray = ["on", "once", "addListener", "prependListener", "prependOnceListener"];

        /**
         * Checks if function node is used in NodeJS listener addition.
         * @param {ASTNode} node A function node
         * @returns {boolean} A function node is used in NodeJS listener addition.
         */
        function isListener(node)
        {
            /*
                Listeners reside in the following structure:
                    CallExpression
                        callee: MemberExpression - its `.property` is listener adding method
                        arguments: [
                            Literal/variable/etc - event name,
                            FunctionExpression - this node
                        ]
            */
            if (node.type !== "FunctionExpression") return false;
            const callExp = node.parent;
            if (!callExp || callExp.type !== "CallExpression") return false;
            const callee = callExp.callee;
            if (!callee || callee.type !== "MemberExpression") return false;
            if (!Array.isArray(callExp.arguments) || callExp.arguments.length !== 2 ||
              callExp.arguments[1] != node) return false;

            return (listenersArray.indexOf(callee.property.name) != -1);
        }

        /**
         * Pushs new checking context into the stack.
         *
         * The checking context is not initialized yet.
         * Because most functions don't have `this` keyword.
         * When `this` keyword was found, the checking context is initialized.
         * @param {ASTNode} node A function node that was entered.
         * @returns {void}
         */
        function enterFunction(node) {

            // `this` can be invalid only under strict mode.
            stack.push({
                init: !context.getScope().isStrict,
                node,
                valid: true
            });
        }

        /**
         * Pops the current checking context from the stack.
         * @returns {void}
         */
        function exitFunction() {
            stack.pop();
        }

        return {

            /*
             * `this` is invalid only under strict mode.
             * Modules is always strict mode.
             */
            Program(node) {
                const scope = context.getScope(),
                    features = context.parserOptions.ecmaFeatures || {};

                stack.push({
                    init: true,
                    node,
                    valid: !(
                        scope.isStrict ||
                        node.sourceType === "module" ||
                        (features.globalReturn && scope.childScopes[0].isStrict)
                    )
                });
            },

            "Program:exit"() {
                stack.pop();
            },

            FunctionDeclaration: enterFunction,
            "FunctionDeclaration:exit": exitFunction,
            FunctionExpression: enterFunction,
            "FunctionExpression:exit": exitFunction,

            // Reports if `this` of the current context is invalid.
            ThisExpression(node) {
                const current = stack.getCurrent();

                if (current && !current.valid) {
                    context.report({
                        node,
                        messageId: "unexpectedThisNode"
                    });
                }
            }
        };
    }
};
