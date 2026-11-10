# Zerro

See what you can spend now and what you have set aside. Zerro is an independent web app that turns Zenmoney categories into budget envelopes. Try the demo from the sign-in screen or connect your Zenmoney account.

- Plan across currencies, move money between envelopes and save toward goals.
- Review income and spending, edit transactions in bulk and undo changes before syncing.
- Work offline after the app has loaded. Backups export the last confirmed server state. Restore previews changes before you apply them.

[Open Zerro](https://zerro.app/) · [Getting started](https://zerro.app/en/about/quick-start) · [Updates](https://t.me/zerroapp) · [User chat](https://t.me/zerrochat)

## Development

Use Node.js 24 (see `.nvmrc`) and the pnpm version pinned in `package.json`. From the checkout run:

```sh
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000/). Discuss larger contributions in an issue or the user chat before implementation.

[Verification](docs/agents/verification.md) · [Core architecture](src/zerro-core/support/documents/README.md) · [UI conventions](docs/ui-styling.md)

## Build version

Vercel production builds from `master` count first-parent commits after the nearest `vMAJOR.MINOR.0` tag. A merge counts as one commit. To start a series, tag its first commit and push the tag with the branch:

```sh
git tag -a v2.1.0 -m v2.1.0
git push --atomic origin master refs/tags/v2.1.0
```

Local and preview builds use the package version.
