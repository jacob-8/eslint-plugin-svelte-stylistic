import type { AST } from 'svelte-eslint-parser'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'consistent-attribute-lines'
export type MessageIds = 'attributeShouldWrap' | 'attributeShouldNotWrap' | 'wrapWhenMultiline'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    docs: {
      description: 'Keep attributes on same line or each on their own line based on the first attributes position',
      recommended: 'stylistic',
    },
    schema: [],
    messages: {
      attributeShouldWrap: 'Attribute should be on its own line to match the first attribute',
      attributeShouldNotWrap: 'Attribute should be on the same line as the tag to match the first attribute',
      wrapWhenMultiline: 'Attributes should be on their own line when a multiline attribute is present',
    },
    fixable: 'whitespace',
  },
  defaultOptions: [],
  create: (context) => {
    return {
      SvelteStartTag(node: AST.SvelteStartTag) {
        if (node.attributes.length === 0)
          return

        const startLine = node.loc.start.line
        const hasMultilineAttr = node.attributes.some((attr) => {
          const attrStartLine = attr.loc.start.line
          const attrEndLine = attr.loc.end.line
          return attrStartLine !== attrEndLine
        })

        if (hasMultilineAttr) {
          node.attributes.forEach((attr, index) => {
            // check if each attribute is on its own line
            const prevAttr = node.attributes[index - 1]
            const prevLine = prevAttr?.loc.end.line || startLine
            const attrLine = attr.loc.start.line
            if (prevLine !== attrLine)
              return

            context.report({
            // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: {
                  ...attr.loc.start,
                  line: attr.loc.start.line - 1,
                },
                end: attr.loc.start,
              },
              messageId: 'wrapWhenMultiline',
              *fix(fixer) {
                const from = attr.range[0] - 1
                const to = attr.range[0]
                yield fixer.replaceTextRange([from, to], '\n')
              },
            })
          })
          return
        }

        const [firstAttr] = node.attributes
        const firstAttrLine = firstAttr.loc.start.line
        const isInline = startLine === firstAttrLine

        if (isInline) {
          node.attributes.forEach((attr, index) => {
            if (index === 0)
              return

            const prevAttr = node.attributes[index - 1]
            const prevAttrLine = prevAttr.loc.end.line
            const attrLine = attr.loc.start.line
            if (prevAttrLine === attrLine)
              return

            context.report({
              // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: prevAttr.loc.end,
                end: attr.loc.start,
              },
              messageId: 'attributeShouldNotWrap',
              *fix(fixer) {
                const [,from] = prevAttr.range
                const [to] = attr.range
                yield fixer.replaceTextRange([from, to], ' ')
              },
            })
          })
        }
        else {
          node.attributes.forEach((attr, index) => {
            if (index === 0)
              return
            const prevAttr = node.attributes[index - 1]
            const prevAttrLine = prevAttr.loc.end.line
            const attrLine = attr.loc.start.line
            if (prevAttrLine !== attrLine)
              return

            context.report({
            // @ts-expect-error - type conversion from SvelteAttribute to node not handled
              node: attr,
              loc: {
                start: prevAttr.loc.end,
                end: attr.loc.start,
              },
              messageId: 'attributeShouldWrap',
              *fix(fixer) {
                const [,from] = prevAttr.range
                const [to] = attr.range
                yield fixer.replaceTextRange([from, to], '\n')
              },
            })
          })
        }
      },
    }
  },
})
