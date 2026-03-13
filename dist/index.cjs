'use strict';

const utils = require('@typescript-eslint/utils');

const hasDocs = [];
const createEslintRule = utils.ESLintUtils.RuleCreator(
  (ruleName) => hasDocs.includes(ruleName) ? `https://github.com/jacob-8/eslint-plugin-svelte-stylistic/blob/main/src/rules/${ruleName}.md` : `https://github.com/jacob-8/eslint-plugin-svelte-stylistic/blob/main/src/rules/${ruleName}.test.ts`
);

const RULE_NAME$1 = "brackets-same-line";
const bracketsSameLine = createEslintRule({
  name: RULE_NAME$1,
  meta: {
    type: "layout",
    docs: {
      description: "Keep closing brackets on the same line as the last attribute or the tag itself",
      recommended: "stylistic"
    },
    schema: [],
    messages: {
      bracketOnNextLine: "Closing bracket is separated from tag and attributes"
    },
    fixable: "whitespace"
  },
  defaultOptions: [],
  create: (context) => {
    return {
      SvelteElement(node) {
        const startLine = node.loc.start.line;
        const lastAttr = node.startTag.attributes[node.startTag.attributes.length - 1];
        const lastAttrLine = lastAttr?.loc.end.line ?? -1;
        const lastLine = Math.max(startLine, lastAttrLine);
        const endOfStartTag = node.startTag.loc.end.line;
        const bracketIsOrphaned = lastLine < endOfStartTag;
        if (bracketIsOrphaned) {
          context.report({
            // @ts-expect-error - type conversion from SvelteAttribute to node not handled
            node: lastAttr || node.startTag,
            loc: {
              start: lastAttr?.loc.end || node.startTag.loc.start,
              end: node.startTag.loc.end
            },
            messageId: "bracketOnNextLine",
            *fix(fixer) {
              const from = lastAttr?.range[1] ?? node.startTag.range[0];
              const to = node.startTag.range[1];
              const code = context.sourceCode.text.slice(from, to);
              yield fixer.replaceTextRange([from, to], code.replace(/\s+/g, ""));
            }
          });
        }
        if (!node.endTag)
          return;
        const endBracketOrphaned = node.endTag.loc.start.line !== node.endTag.loc.end.line;
        if (endBracketOrphaned) {
          context.report({
            // @ts-expect-error - type conversion from SvelteAttribute to node not handled
            node: node.endTag,
            loc: {
              start: node.endTag.loc.start,
              end: node.endTag.loc.end
            },
            messageId: "bracketOnNextLine",
            *fix(fixer) {
              const from = node.endTag.range[0];
              const to = node.endTag.range[1];
              const code = context.sourceCode.text.slice(from, to);
              yield fixer.replaceTextRange([from, to], code.replace(/\s+/g, ""));
            }
          });
        }
      }
    };
  }
});

const RULE_NAME = "consistent-attribute-lines";
const consistentAttributeLines = createEslintRule({
  name: RULE_NAME,
  meta: {
    type: "layout",
    docs: {
      description: "Keep attributes on same line or each on their own line based on the first attributes position",
      recommended: "stylistic"
    },
    schema: [],
    messages: {
      attributeShouldWrap: "Attribute should be on its own line to match the first attribute",
      attributeShouldNotWrap: "Attribute should be on the same line as the tag to match the first attribute",
      wrapWhenMultiline: "Attributes should be on their own line when a multiline attribute is present"
    },
    fixable: "whitespace"
  },
  defaultOptions: [],
  create: (context) => {
    return {
      SvelteStartTag(node) {
        if (node.attributes.length === 0)
          return;
        const startLine = node.loc.start.line;
        const hasMultilineAttr = node.attributes.some((attr) => {
          const attrStartLine = attr.loc.start.line;
          const attrEndLine = attr.loc.end.line;
          return attrStartLine !== attrEndLine;
        });
        if (hasMultilineAttr) {
          node.attributes.forEach((attr, index) => {
            const prevAttr = node.attributes[index - 1];
            const prevLine = prevAttr?.loc.end.line || startLine;
            const attrLine = attr.loc.start.line;
            if (prevLine !== attrLine)
              return;
            context.report({
              // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: {
                  ...attr.loc.start,
                  line: attr.loc.start.line - 1
                },
                end: attr.loc.start
              },
              messageId: "wrapWhenMultiline",
              *fix(fixer) {
                const from = attr.range[0] - 1;
                const to = attr.range[0];
                yield fixer.replaceTextRange([from, to], "\n");
              }
            });
          });
          return;
        }
        const [firstAttr] = node.attributes;
        const firstAttrLine = firstAttr.loc.start.line;
        const isInline = startLine === firstAttrLine;
        if (isInline) {
          node.attributes.forEach((attr, index) => {
            if (index === 0)
              return;
            const prevAttr = node.attributes[index - 1];
            const prevAttrLine = prevAttr.loc.end.line;
            const attrLine = attr.loc.start.line;
            if (prevAttrLine === attrLine)
              return;
            context.report({
              // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: prevAttr.loc.end,
                end: attr.loc.start
              },
              messageId: "attributeShouldNotWrap",
              *fix(fixer) {
                const [, from] = prevAttr.range;
                const [to] = attr.range;
                yield fixer.replaceTextRange([from, to], " ");
              }
            });
          });
        } else {
          node.attributes.forEach((attr, index) => {
            if (index === 0)
              return;
            const prevAttr = node.attributes[index - 1];
            const prevAttrLine = prevAttr.loc.end.line;
            const attrLine = attr.loc.start.line;
            if (prevAttrLine !== attrLine)
              return;
            context.report({
              // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: prevAttr.loc.end,
                end: attr.loc.start
              },
              messageId: "attributeShouldWrap",
              *fix(fixer) {
                const [, from] = prevAttr.range;
                const [to] = attr.range;
                yield fixer.replaceTextRange([from, to], "\n");
              }
            });
          });
        }
      }
    };
  }
});

const index = {
  rules: {
    "brackets-same-line": bracketsSameLine,
    "consistent-attribute-lines": consistentAttributeLines
  }
};

module.exports = index;
