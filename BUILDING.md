## Requirements

- Node.js v14. (v12 might also work)

## Dev build

```sh
npm run build
```

The build files are in the `./dist/` directory.

The `"private"` inthe package.json is set to `true`, so you won't publish it accidentally.

## Prod build

```sh
npm run dist
```

Same plus some tests and `"private": true`
