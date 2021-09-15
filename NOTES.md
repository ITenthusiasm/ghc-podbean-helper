# Notes and Findings

## Personal Notes

- `bloated` in a commit message indicates a commit that could not be practically made atomic at the time. Bloated commits should be avoided whenever possible. However, `bloated` is intended to _try_ to help clarify history when such commits are "unavoidable". ("Where did this ton of changes come from? Oh...")
  - Of course, we only recently started getting into the concept of "atomic commits". So the many of the much earlier comments will likely be bloated. :)

## Typescript

- [Destructuring nullable objects](https://stackoverflow.com/questions/45210111/destructuring-nullable-objects)
- [Adding to global TS namespaces](https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul) (seems hackish though?)

## Sass

- [Why Sass no longer supports extending compound selectors](https://sass-lang.com/documentation/breaking-changes/extend-compound)
  - [Also this](https://sass-lang.com/documentation/at-rules/extend#disallowed-selectors)

## Jest

- [Custom `Jest` Matchers](https://jestjs.io/docs/expect#custom-matchers-api) (includes custom snapshots)
- [Custom `Jest` Matcher Types (TS)](https://stackoverflow.com/questions/60227432/how-to-get-a-jest-custom-matcher-working-in-typescript)

## Vue Testing

- Thankfully, the obscure babel package is no longer needed for testing in Vue 3. But now `ts-jest` is required when using TS with Vue 3. It's not readily apparent why, though they seem to want access to all `tsconfig.json`s apparently. Search their docs and/or GitHub issues for more details. Maybe ask questions about if this is _really_ necessary and if there are other options. But for now, we have to make do with what we have... so we still have some "obscure packages"...but they're not as bad.
  - Also, it seems `vue-jest` is in the process of trying to support `jest v27`, **which provides its own type definitions**. Keep an eye out for the PR activity on `vue-jest` and `@testing-library/vue`.
