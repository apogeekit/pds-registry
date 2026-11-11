# pds-registry

> [!WARNING]
> **Work in progress (WIP).** This project is experimental and not ready for production use. APIs and data formats may change.

AT Protocol account hosts and entryways, extracted from [launcher.at](https://github.com/solimaniac/launcher-at). Includes descriptions, regions, invite information, and logos.

```sh
npm install github:solimaniac/pds-registry
```

```ts
import { selectProviders } from 'pds-registry'

const providers = selectProviders({ ids: ['eurosky', 'blacksky'] })
// Pass providers directly to launcher-components.
```

Each provider has its own directory:

```text
providers/bluesky/
  provider.json
  bluesky.svg
```

To add a provider, copy an existing directory, match its name to the provider's `id`, and edit `provider.json` using the fields in `schema.json#/items`. Include the referenced logo in that directory. Also update the root `providers.json`, which is maintained manually and exported as `pds-registry/providers.json`. Tests verify that it matches every provider record.

Individual records and logos are available at `pds-registry/providers/<id>/provider.json` and `pds-registry/providers/<id>/<logo>`. Copy provider directories into your app's public assets if needed; logo filenames are relative to their provider's directory. Names and logos belong to their owners.

Metadata is a curated snapshot, not a live availability guarantee. Missing `requiresInvite` means unknown.

Not published to npm yet. Development: `npm ci && npm run check`. To publish later: `npm publish --access public`; npmx.dev browses the npm registry. Nothing is published automatically.
