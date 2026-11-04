import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 1) ما لا نفحصه: ملفات مُولَّدة أو ليست كودنا
  globalIgnores(['dist', 'dev-dist', 'android', 'ios', 'node_modules', 'coverage']),

  // 2) كود التطبيق (يعمل في المتصفح)
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // 3) ملفات الإعداد (تعمل في Node لا المتصفح)
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
])
