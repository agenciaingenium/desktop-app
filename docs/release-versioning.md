# Release Versioning

- Public GitHub releases are driven by repository tags such as `1.1.8`.
- Release candidates can use tags such as `v3.3.0-b1`.
- The Electron packaging step reads `packages/app/package.json`, so CI rewrites that file to match the current release tag before running `electron-builder`.
- This rewrite only happens in CI during release workflows. It does not change local development versioning.
