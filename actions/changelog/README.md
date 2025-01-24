# Changelog

Automates the generation of changelogs by parsing commits in a source branch and updating the changelog file.

## Inputs:

| Name                         | Description                                              | Default                  | Required |
|------------------------------|----------------------------------------------------------|--------------------------|----------|
| `changelog-file-name`        | The file to be updated.                                  | `CHANGELOG.md`           | No       |
| `release-branch`             | The branch where releases are made.                      | `main`                   | No       |
| `source-branch`              | The branch used for changelog generation.                |                          | **Yes**  |
| `github-token`               | GitHub token for authentication.                         | `${{ github.token }}`    | No       |
| `breaking-change-commit-matchers` | Regular expressions to identify breaking change commits. | `BREAKING CHANGE`        | No       |
| `feature-commit-matchers`    | Regular expressions to identify feature commits.         | `^feature`               | No       |
| `bugfix-commit-matchers`     | Regular expressions to identify bugfix commits.          | `^bugfix`                | No       |
| `include-default-commit-matchers` | Whether to include the inbuilt commit matchers.          | `true`                   | No       |

## Outputs:

| Name            | Description                                   |
|-----------------|-----------------------------------------------|
| `pr-created`    | Indicates if a pull request was created (`true`/`false`). |

## Example Usage:

```yaml
jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Run Changelog Action
        uses: GotBot-AI/releaser/actions/changelog@v1
        with:
          release-branch: 'master'
          source-branch: 'develop'
          changelog-file-name: 'CHANGELOG.md'
```