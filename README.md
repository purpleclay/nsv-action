# NSV Action

NSV (Next Semantic Version) is a convention-based semantic versioning tool that leans on the power of conventional commits to make versioning your software a breeze!

Check out the latest [documentation](https://docs.purpleclay.dev/nsv/).

## Inputs

| Name        | Required | Type    | Description                                                                                              |
| ----------- | -------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `token`     | no       | string  | A token for performing authenticated requests to the GitHub API                                          |
| `version`   | no       | string  | The version of NSV to download (default: `latest`)                                                       |
| `next-only` | no       | boolean | If the next semantic version should just be calculated. Repository will not be tagged (default: `false`) |

## Outputs

| Name  | Type   | Description                          |
| ----- | ------ | ------------------------------------ |
| `nsv` | string | The calculated next semantic version |

## Environment variables

You can also define CI/CD variables within your GitLab project to configure the behavior of both [nsv](https://docs.purpleclay.dev/nsv/reference/env-vars/) and [gpg-import](https://github.com/purpleclay/gpg-import/blob/main/README.md#features). All are optional:

- `NSV_FORMAT` is a Go template for formatting the generated semantic version tag.
- `NSV_TAG_MESSAGE` is a custom message when creating an annotated tag.
- `GPG_PRIVATE_KEY` is the base64 encoded GPG private key in armor format.
- `GPG_PASSPHRASE` is an optional passphrase if the GPG key is password protected.
- `GPG_TRUST_LEVEL` is an owner trust level assigned to the imported GPG key.

> Ensure all environment variables are wrapped within double quotes to prevent any unintentional side effects

## Using the action

### Tag the repository

If you wish to tag the repository without triggering another workflow, you must set the permissions of the job to `contents: write`.

```yaml
name: ci
on:
  push:
    branches:
      - main
jobs:
  ci:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: NSV
        uses: purpleclay/nsv-action@v1
        env:
          GPG_PRIVATE_KEY: "${{ secrets.GPG_PRIVATE_KEY }}"
```

#### User impersonation

When tagging your repository, `nsv` will identify the person associated with the commit that triggered the release and pass this to git through the `user.name` and `user.email` config settings.

You can override this behavior by importing a GPG key, manually setting those git config settings, or using the reserved git environment variables `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL`; see the [documentation](https://docs.purpleclay.dev/nsv/tag-version/#committer-impersonation) for further details.

### Trigger another workflow

If you wish to trigger another workflow after `nsv` tags the repository, you must manually create a token (PAT) with the `public_repo` permission and use it during the checkout. For best security practice, use a short-lived token.

```yaml
name: ci
on:
  push:
    branches:
      - main
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: "${{ secrets.TOKEN }}"

      - name: NSV
        uses: purpleclay/nsv-action@v1
        env:
          GPG_PRIVATE_KEY: "${{ secrets.GPG_PRIVATE_KEY }}"
          GPG_PASSPHRASE: "${{ secrets.GPG_PASSPHRASE }}"
```

### Capturing the next tag

You can capture the next tag without tagging the repository by setting the `next-only` input to `true`.

```yaml
name: ci
on:
  push:
    branches:
      - main
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: NSV
        id: nsv
        uses: purpleclay/nsv-action@v1
        with:
          next-only: true

      - name: Print Tag
        run: |
          echo "Next calculated tag: ${{ steps.nsv.outputs.nsv }}"
```
