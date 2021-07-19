# Notes and Findings

## Typescript

- [Destructuring nullable objects](https://stackoverflow.com/questions/45210111/destructuring-nullable-objects)

## Sass

- [Why Sass no longer supports extending compound selectors](https://sass-lang.com/documentation/breaking-changes/extend-compound)
  - [Also this](https://sass-lang.com/documentation/at-rules/extend#disallowed-selectors)

## Vue Testing

- Thankfully, the obscure babel package is no longer needed for testing in Vue 3. But now `ts-jest` is required when using TS with Vue 3. It's not readily apparent why, though they seem to want access to all `tsconfig.json`s apparently. Search their docs and/or GitHub issues for more details. Maybe ask questions about if this is _really_ necessary and if there are other options. But for now, we have to make do with what we have... so we still have some "obscure packages"...but they're not as bad.
  - Also, it seems `vue-jest` is in the process of trying to support `jest v27`, **which provides its own type definitions**. Keep an eye out for the PR activity on `vue-jest` and `@testing-library/vue`.
