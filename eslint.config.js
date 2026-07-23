import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude/ can hold sibling git worktrees (parallel agent sessions) that carry
  // their own tsconfig.json; leaving them unignored makes typescript-eslint's
  // project service see multiple candidate tsconfigRootDirs and fail to parse
  // every file. It is already gitignored for the same "not part of this tree" reason.
  globalIgnores(['dist', 'src-tauri/target', 'docs', '.claude']),
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
  },
])
