# Release Action

This GitHub Action automates the process of preparing a release pull request (PR) and optionally creating a GitHub
release. This action is customizable and integrates seamlessly with your repository.

## Features

- Generates changelogs from commit messages.
- Prepares a release PR with updates from the specified changelog file.
- Supports targeting a specific branch for releases.
- Optionally skips creating a GitHub release.

## Inputs

| Name                  | Description                                               | Default        | Required |
|-----------------------|-----------------------------------------------------------|----------------|----------|
| `file-name`           | The file that should be updated, typically the changelog. | `CHANGELOG.md` | No       |
| `target-branch`       | The branch on which releases are performed.               | `main`         | No       |
| `github-token`        | Your GitHub token for authentication.                     | N/A            | Yes      |
| `skip-github-release` | Whether to skip creating a GitHub release.                | `false`        | No       |

## Outputs

| Name              | Description                                             |
|-------------------|---------------------------------------------------------|
| `pr-created`      | Indicates if a release PR was successfully created.     |
| `release-created` | Indicates if a GitHub release was successfully created. |

## Usage

Below is an example of how to use the **Release PR** action in a workflow file:

```yaml
name: Create Release PR

on:
  push:
    branches:
      - main

jobs:
  release-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Prepare Release PR
        uses: your-username/release-pr-action@v1
        with:
          file-name: 'CHANGELOG.md'
          target-branch: 'main'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          skip-github-release: 'false'
