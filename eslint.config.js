import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import noComments from 'eslint-plugin-no-comments';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYER_IMPORTS = {
  engine: [],
  design: [],
  copy: ['engine'],
  levels: ['engine', 'copy'],
  game: ['engine', 'copy', 'levels'],
  scene: ['engine', 'copy', 'levels', 'design'],
  storage: ['engine', 'copy', 'levels'],
  ui: ['engine', 'copy', 'levels', 'game', 'scene', 'storage', 'design'],
  testing: ['engine', 'copy', 'levels'],
};
const LAYERS = Object.keys(LAYER_IMPORTS);
const VIEW_LAYERS = ['scene', 'ui'];
const TEST_FILES = ['**/*.test.{ts,tsx}'];
const HOOK_FILES = ['src/**/use-*.ts'];

const KEBAB_CASE = '+([a-z0-9])*(-+([a-z0-9]))';

const PARENT_IMPORT = { regex: '(^|/)\\.\\.(/|$)', message: 'Use the @/ alias instead of ../ imports.' };
const NO_EFFECTS = { name: 'react', importNames: ['useEffect', 'useLayoutEffect'], message: 'Effects live in use-*.ts hooks; prefer @mantine/hooks.' };
const NO_FIRE_EVENT = ['@testing-library/react', '@testing-library/dom'].map((name) => ({
  name,
  importNames: ['fireEvent'],
  message: 'Use @testing-library/user-event.',
}));
const ENGINE_PACKAGES = { group: ['react', 'react-dom', '@mantine/*'], message: 'The engine stays free of UI, rendering and hooks.' };

const NO_DYNAMIC_IMPORT = { selector: 'ImportExpression', message: 'Use static imports only, so the layer rules can check them.' };
const NO_EFFECT_CALLS = { selector: 'MemberExpression[property.name=/^use(Layout)?Effect$/]', message: 'Effects live in use-*.ts hooks.' };
const NO_FIXED_WAIT_MESSAGE =
  'A test never waits a fixed time: wait for a state (an expectation, expect.poll, expect.element, or the still scene helper), or advance a fake clock (page.clock in e2e tests, vi.advanceTimersByTime in browser tests).';
const NO_FIXED_WAIT = [
  { selector: "CallExpression[callee.property.name='waitForTimeout']", message: NO_FIXED_WAIT_MESSAGE },
  { selector: "CallExpression[callee.name=/^(setTimeout|setInterval)$/]", message: NO_FIXED_WAIT_MESSAGE },
  { selector: "CallExpression[callee.object.name=/^(window|globalThis)$/][callee.property.name=/^(setTimeout|setInterval)$/]", message: NO_FIXED_WAIT_MESSAGE },
];
const TIME_MESSAGE = 'Take the time as a parameter.';
const RANDOM_MESSAGE = 'Take randomness as a parameter.';
const ENGINE_SYNTAX = [
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: TIME_MESSAGE },
  { selector: "NewExpression[callee.name='Date']", message: TIME_MESSAGE },
  { selector: "MemberExpression[object.name='Math'][property.name='random']", message: RANDOM_MESSAGE },
  { selector: "VariableDeclarator[init.name='Math'] > ObjectPattern > Property[key.name='random']", message: RANDOM_MESSAGE },
];
const ENGINE_GLOBALS = ['window', 'document', 'localStorage', 'sessionStorage', 'fetch', 'globalThis', 'self', 'Date'];

/**
 * Builds the no-restricted-syntax setting for one kind of source file.
 * @param {{ isEngine?: boolean, isHook?: boolean, isBrowserTest?: boolean }} kind Which kind of file the setting is for.
 * @returns {['error', ...object[]]} The rule entry.
 */
function syntaxRules({ isEngine = false, isHook = false, isBrowserTest = false }) {
  return ['error', NO_DYNAMIC_IMPORT, ...(isHook ? [] : [NO_EFFECT_CALLS]), ...(isEngine ? ENGINE_SYNTAX : []), ...(isBrowserTest ? NO_FIXED_WAIT : [])];
}

/**
 * Builds the no-restricted-imports setting for a file inside a layer.
 * @param {string} layer The layer the file lives in.
 * @param {{ isTest: boolean, isHook: boolean }} kind Which kind of file the setting is for.
 * @returns {['error', object]} The rule entry.
 */
function layerImports(layer, { isTest, isHook }) {
  const allowed = new Set([layer, ...LAYER_IMPORTS[layer]]);
  const forbiddenLayers = LAYERS.filter((other) => !allowed.has(other) && !(isTest && other === 'testing'));
  const paths = [
    ...NO_FIRE_EVENT,
    ...(isHook ? [] : [NO_EFFECTS]),
    ...(isTest ? [] : [{ name: `@/${layer}`, message: 'Inside a layer, import the file directly.' }]),
  ];
  const patterns = [
    PARENT_IMPORT,
    ...(forbiddenLayers.length > 0 ? [{ regex: `^@/(${forbiddenLayers.join('|')})(/|$)`, message: `${layer} may not import ${forbiddenLayers.join(', ')}.` }] : []),
    ...(isTest ? [] : [{ regex: `^@/(?!${layer}/)[a-z]+/`, message: 'Import other layers through their barrel.' }]),
    ...(layer === 'engine' ? [ENGINE_PACKAGES] : []),
  ];
  return ['error', { paths, patterns }];
}

function rootImports({ isTest }) {
  const paths = [...NO_FIRE_EVENT, NO_EFFECTS, ...(isTest ? [] : [{ name: '@/testing', message: 'Only tests import @/testing.' }])];
  const patterns = [PARENT_IMPORT, ...(isTest ? [] : [{ regex: '^@/[a-z]+/', message: 'Import layers through their barrel.' }])];
  return ['error', { paths, patterns }];
}

const layerBlocks = LAYERS.flatMap((layer) => [
  {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    ignores: [...TEST_FILES, ...HOOK_FILES],
    rules: { 'no-restricted-imports': layerImports(layer, { isTest: false, isHook: false }) },
  },
  { files: [`src/${layer}/**/use-*.ts`], rules: { 'no-restricted-imports': layerImports(layer, { isTest: false, isHook: true }) } },
  { files: [`src/${layer}/**/*.test.{ts,tsx}`], rules: { 'no-restricted-imports': layerImports(layer, { isTest: true, isHook: false }) } },
]);

const viewBlocks = VIEW_LAYERS.map((layer) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  ignores: TEST_FILES,
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      { paths: [{ name: '@/engine', allowTypeImports: true, message: 'Views read engine types and results only.' }] },
    ],
  },
}));

const syntaxBlocks = [
  { files: ['src/**/*.{ts,tsx}'], ignores: [...TEST_FILES, ...HOOK_FILES, 'src/engine/**'], rules: { 'no-restricted-syntax': syntaxRules({}) } },
  { files: HOOK_FILES, ignores: [...TEST_FILES, 'src/engine/**'], rules: { 'no-restricted-syntax': syntaxRules({ isHook: true }) } },
  { files: ['src/**/*.test.{ts,tsx}'], rules: { 'no-restricted-syntax': syntaxRules({}) } },
  { files: ['src/**/*.browser.test.{ts,tsx}'], rules: { 'no-restricted-syntax': syntaxRules({ isBrowserTest: true }) } },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-globals': ['error', ...ENGINE_GLOBALS],
      'no-restricted-syntax': syntaxRules({ isEngine: true }),
    },
  },
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  { files: ['src/*.{ts,tsx}'], ignores: TEST_FILES, rules: { 'no-restricted-imports': rootImports({ isTest: false }) } },
  { files: ['src/*.test.{ts,tsx}'], rules: { 'no-restricted-imports': rootImports({ isTest: true }) } },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: NO_FIRE_EVENT, patterns: [PARENT_IMPORT] }], 'no-restricted-syntax': ['error', ...NO_FIXED_WAIT] },
  },
  { files: ['scripts/**/*.test.ts'], rules: { 'no-restricted-imports': ['error', { paths: NO_FIRE_EVENT }] } },
  ...layerBlocks,
  ...viewBlocks,
  ...syntaxBlocks,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'tests/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.{js,jsx,ts,tsx}': KEBAB_CASE }, { ignoreMiddleExtensions: true }],
      'check-file/folder-naming-convention': ['error', { 'src/**/': KEBAB_CASE, 'tests/**/': KEBAB_CASE }],
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { 'no-comments': noComments },
    rules: {
      'no-comments/disallowComments': ['error', { allow: ['(?<=^)\\*', '@vitest-environment (?:jsdom|node)$'] }],
    },
  },
);
