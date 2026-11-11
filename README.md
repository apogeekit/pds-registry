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

The same snapshot is available as `pds-registry/providers.json`, with a JSON schema at `pds-registry/schema.json`. Copy `logos/` into your app's public assets if needed. Names and logos belong to their owners.

Metadata is a curated snapshot, not a live availability guarantee. Missing `requiresInvite` means unknown.

Not published to npm yet. Development: `npm ci && npm run check`. To publish later: `npm publish --access public`; npmx.dev browses the npm registry. Nothing is published automatically.
