/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'coverage/**', '.angular/**'],
  rules: {
    // Angular's `:host` and `::ng-deep` are valid in component styles.
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['host'] }],
    // Sass placeholders and modules follow kebab-case like the rest of the project.
    'scss/at-use-no-unnamespaced': true,
    'scss/no-global-function-names': true,
    'declaration-no-important': [true, { severity: 'warning' }],
  },
};
