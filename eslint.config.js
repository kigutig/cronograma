import js from '@eslint/js';
import globals from 'globals';
import pluginSecurity from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Supabase
        db: 'writable',
        supabase: 'readonly',
        SUPABASE_URL: 'readonly',
        SUPABASE_ANON_KEY: 'readonly',

        // Auth & Shared State
        currentUser: 'writable',
        userProfile: 'writable',
        adminUser: 'writable',
        adminProfile: 'writable',
        allUsers: 'writable',
        allRows: 'writable',
        aguardandoList: 'writable',
        activeTab: 'writable',
        editingRowId: 'writable',
        realtimeSub: 'writable',
        aguardandoSub: 'writable',
        jarvisHelpers: 'writable',

        // Constants & Utilities from auth.js
        ROLE_LABELS: 'writable',
        STATUS_OPTIONS: 'writable',
        STATUS_META: 'writable',
        ARCHIVED_STATUS: 'writable',
        getStatusMeta: 'writable',
        getSession: 'writable',
        getCurrentUser: 'writable',
        getUserProfile: 'writable',
        requireAuth: 'writable',
        requireAdmin: 'writable',
        isAdmin: 'writable',
        isEditor: 'writable',
        doSignOut: 'writable',
        showToast: 'writable',
        fmtDate: 'writable',
        fmtCurrency: 'writable',
        fmtDateTime: 'writable',
        friendlyError: 'writable',
        openModal: 'writable',
        closeModal: 'writable',
        initTheme: 'writable',
        toggleTheme: 'writable',
        updateThemeButton: 'writable',
        escHtml: 'writable',

        // Functions from cronograma.js
        initApp: 'writable',
        loadCronograma: 'writable',
        loadAguardando: 'writable',
        switchTab: 'writable',
        applyFilters: 'writable',
        clearFilters: 'writable',
        openAddModal: 'writable',
        openEditModal: 'writable',
        agendarItem: 'writable',
        openViewModal: 'writable',
        openViewAguardando: 'writable',
        confirmDelete: 'writable',
        openAddAguardando: 'writable',
        toggleFullscreenElement: 'writable',
        hidePageLoading: 'writable',

        // Functions from admin.js
        initAdmin: 'writable',
        loadUsers: 'writable',
        getInitials: 'writable',

        // Functions from jarvis.js
        initJarvis: 'writable',
        toggleJarvis: 'writable',
        closeJarvisOverlay: 'writable'
      }
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^(init|render|load|setup|open|close|save|confirm|execute|toggle|switch|apply|clear|quick|agendar|get|fmt|friendly|is|show|do|esc|hide|reset|frete|icon|filter|create|require|ROLE_|STATUS_|ARCHIVED_|db|currentUser|userProfile|adminUser|adminProfile|allUsers|allRows|aguardandoList|activeTab|editingRowId|realtimeSub|aguardandoSub|jarvisHelpers|_).*'
        }
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'error',
      'no-console': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-eval-with-expression': 'warn'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**',
      'sbom.json',
      'supabase/.temp/**'
    ]
  }
];
