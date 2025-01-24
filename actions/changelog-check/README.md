# Changelog Check

Validates whether the changelog file is up-to-date with the source branch.

## Inputs:

| Name            | Description                               | Default               | Required |
|-----------------|-------------------------------------------|-----------------------|----------|
| `source-branch` | The branch used for changelog validation. |                       | **Yes**  |
| `github-token`  | GitHub token for authentication.          | `${{ github.token }}` | No       |

## Outputs:

| Name                  | Description                                                                    |
|-----------------------|--------------------------------------------------------------------------------|
| `changelog-is-synced` | Indicates if the changelog is in sync with the source branch (`true`/`false`). |

## Example Usage:

```yaml
jobs:
  changelog-check:
    runs-on: ubuntu-latest
    steps:
      - name: Run Changelog Check
        uses: GotBot-AI/releaser/actions/changelog-check@v1
        with:
          source-branch: 'develop'
```