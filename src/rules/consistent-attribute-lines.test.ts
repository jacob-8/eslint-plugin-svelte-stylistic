/* eslint-disable ts/quotes */
import { RuleTester } from '../../vendor/rule-tester/src/RuleTester'
import rule, { RULE_NAME } from './consistent-attribute-lines'

const valids: string[] = [
  `<div>Text</div>`,

  `<div />`,

  `<div baz foo bar="2">Text</div>`,

  `<div
    baz
    foo
    bar="2">Text</div>`,

  `<div
    foo
    use:baz={{
      setting: 'value',
    }} />`,
]

// See snapshot for fixed code
const invalids = [
  `<div baz
    foo
    bar="2">Text</div>`,

  `<div baz foo
    bar="2">Text</div>`,

  `<div
    baz foo bar="2">Text</div>`,

  `<div foo
    bar />`,

  `<div foo use:baz={{
              setting: 'value',
            }} />`,

  `<div foo use:baz={{
              setting: 'value',
            }} use:box />`,
]

const ruleTester: RuleTester = new RuleTester({
  parser: require.resolve('svelte-eslint-parser'),
})

ruleTester.run(RULE_NAME, rule as any, {
  valid: valids,
  invalid: invalids.map(i => ({
    code: i,
    errors: null,
    onOutput: (output: string) => {
      expect(output).toMatchSnapshot()
    },
  })),
})
