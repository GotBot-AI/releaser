### Release

**Purpose:**  
Automates the release process, including generating changelogs, tagging releases, and optionally creating GitHub releases.

#### Inputs:

| Name                         | Description                                                                                     | Default                  | Required |
|------------------------------|-------------------------------------------------------------------------------------------------|--------------------------|----------|
| `changelog-file-name`        | The file to be updated.                                                                        | `CHANGELOG.md`           | No       |
| `release-branch`             | The branch where releases are made.                                                           | `main`                   | No       |
| `github-token`               | GitHub token for authentication.                                                              | `${{ github.token }}`    | No       |
| `breaking-change-commit-matchers` | Regular expressions to identify breaking change commits.                                      | `BREAKING CHANGE`        | No       |
| `feature-commit-matchers`    | Regular expressions to identify feature commits.                                              | `^feature`               | No       |
| `bugfix-commit-matchers`     | Regular expressions to identify bugfix commits.                                               | `^bugfix`                | No       |
| `skip-github-release`        | Skips the creation of a GitHub release.                                                       | `false`                  | No       |
| `include-default-commit-matchers` | Whether to include default matchers.                                                       | `true`                   | No       |

#### Outputs:

| Name                | Description                                      |
|---------------------|--------------------------------------------------|
| `release-created`   | Indicates if a GitHub release was created (`true`/`false`). |

#### Example Usage:

```yaml
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Run Release Action
        uses: GotBot-AI/releaser/actions/release@v1
        with:
          release-branch: 'master'
          changelog-file-name: 'CHANGELOG.md'
          skip-github-release: false
```
