import js from '@eslint/js';
import noComments from 'eslint-plugin-no-comments';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYER_IMPORTS = {
  engine: [],
  copy: ['engine'],
  levels: ['engine', 'copy'],
  game: ['engine', 'copy', 'levels'],
  scene: ['engine', 'copy', 'levels'],
  storage: ['engine', 'copy', 'levels'],
  ui: ['engine', 'copy', 'levels', 'game', 'scene', 'storage'],
  testing: ['engine', 'copy', 'levels'],
};
const LAYERS = Object.keys(LAYER_IMPORTS);
const VIEW_LAYERS = ['scene', 'ui'];
const TEST_FILES = ['**/*.test.{ts,tsx}'];
const HOOK_FILES = ['src/**/use-*.ts'];

const PARENT_IMPORT = { regex: '^\\.\\./', message: 'Use the @/ alias instead of ../ imports.' };
const NO_EFFECTS = { name: 'react', importNames: ['useEffect', 'useLayoutEffect'], message: 'Effects live in use-*.ts hooks; prefer @mantine/hooks.' };
const NO_FIRE_EVENT = ['@testing-library/react', '@testing-library/dom'].map((name) => ({
  name,
  importNames: ['fireEvent'],
  message: 'Use @testing-library/user-event.',
}));
const ENGINE_PACKAGES = { group: ['react', 'react-dom', 'three', '@react-three/*', '@mantine/*'], message: 'The engine stays free of UI, rendering and hooks.' };

function layerImports(layer, { isTest, isHook }) {
  const allowed = new Set([layer, ...LAYER_IMPORTS[layer]]);
  const forbiddenLayers = LAYERS.filter((other) => !allowed.has(other) && !(isTest && other === 'testing'));
  const paths = [
    ...NO_FIRE_EVENT,
    ...(isHook ? [] : [NO_EFFECTS]),
    ...forbiddenLayers.map((other) => ({ name: `@/${other}`, message: `${layer} may not import ${other}.` })),
    ...(isTest ? [] : [{ name: `@/${layer}`, message: 'Inside a layer, import the file directly.' }]),
  ];
  const patterns = [
    PARENT_IMPORT,
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
  { files: ['tests/**/*.ts'], rules: { 'no-restricted-imports': ['error', { patterns: [PARENT_IMPORT] }] } },
  ...layerBlocks,
  ...viewBlocks,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [...HOOK_FILES, 'src/engine/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "MemberExpression[object.name='React'][property.name=/^use(Layout)?Effect$/]", message: 'Effects live in use-*.ts hooks.' },
      ],
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'fetch'],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'Take the time as a parameter.' },
        { selector: "NewExpression[callee.name='Date']", message: 'Take the time as a parameter.' },
        { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: 'Take randomness as a parameter.' },
      ],
    },
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    plugins: { 'no-comments': noComments },
    rules: {
      'no-comments/disallowComments': ['error', { allow: ['\\*', '@vitest-environment', 'eslint', 'global'] }],
    },
  },
);
