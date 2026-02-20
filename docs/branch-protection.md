# Branch Protection Baseline (`main`)

Configure these repository settings in GitHub:

1. Settings -> Branches -> Add branch protection rule for `main`.
2. Enable `Require a pull request before merging`.
3. Enable `Require status checks to pass before merging`.
4. Add required checks:
`Tests / Stability-Baseline`
5. Enable `Require branches to be up to date before merging`.
6. Enable `Require conversation resolution before merging`.
7. Disable force pushes and branch deletions for `main`.

This ensures release-critical checks are mandatory before changes reach `main`.
