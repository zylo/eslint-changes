# ESLint Changes

ESLint changes is a script that is run by TravisCI for commits and pull
requests. It runs ESLint on the files that were changed and adds the
results to GitHub as a status.

![ESLint Changes status](https://www.dropbox.com/s/ylsxw5exs85aw9f/Screenshot%202016-10-20%2017.20.44.png?dl=1)

## Installation

- Set GITHUB_TOKEN environment variable in Travis to be a GitHub access
  token with repo privileges.
- Install the eslint-changes package from npm during the Travis install
  step:

```
install:
  - npm install --save-dev eslint-changes
```

- Run the ESLint Changes bin during the Travis script step:

```
script:
  - ./node_modules/.bin/eslint-changes
```

## Details
- ESLint Changes has `eslint: "3.x"` as a peer dependency. That means that
  your project must already have eslint installed and configured.
- ESLint Changes will use any configuration like .eslintrc, .eslintignore,
  plugins or other configurations that are present in the project.
- If you don't like installing eslint-changes from Travis, you can add it
  to your projects package.json and add only the script part to
  .travis.yml.
