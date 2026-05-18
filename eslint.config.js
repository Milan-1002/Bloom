import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Supabase singleton enforcement: createClient may only be imported in src/lib/supabase.ts
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              importNames: ['createClient'],
              message: 'createClient must only be imported in src/lib/supabase.ts. Use the singleton from there.',
            },
          ],
          patterns: [
            {
              group: ['@supabase/supabase-js'],
              importNames: ['createClient'],
              message: 'createClient must only be imported in src/lib/supabase.ts. Use the singleton from there.',
            },
          ],
        },
      ],
    },
  },
])
