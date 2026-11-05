import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import storybook from 'eslint-plugin-storybook'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Keeps import statements compatible with verbatimModuleSyntax.
      // Inline import() type annotations are unrelated to that and stay
      // allowed: Vitest's importOriginal<typeof import('...')>() needs them.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Compiler-level react-hooks rules find real problems,
      // but fixing them is a separate refactoring
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      // Intentional non-breaking spaces in Russian interface text
      'no-irregular-whitespace': [
        'error',
        { skipStrings: true, skipTemplates: true, skipJSXText: true },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // `cn` (clsx + tailwind-merge) is the only class-name helper we use:
      // raw clsx skips the Tailwind conflict resolution.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'clsx',
              message:
                "Use `cn` from '@/6-shared/ui/shadcn/utils' instead of clsx.",
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },
  {
    // The single place clsx is allowed: the implementation of `cn` itself.
    files: ['src/6-shared/ui/shadcn/utils.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  storybook.configs['flat/recommended']
)
