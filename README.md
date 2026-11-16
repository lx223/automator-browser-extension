# Overtabbed browser extension

A browser extension built with TypeScript, React, and Vite.

```sh
pnpm install
pnpm dev
pnpm build
```

## Browser domain models

Protobuf schemas in `proto/browser/v1/browser.proto` define `Tab`, `Group`,
`Window`, and tab audio state. Buf generates TypeScript into `src/gen` using
Protobuf-ES. Generated files are checked in; edit the schemas and regenerate
instead of editing generated code. The Buf CLI and generator are pinned npm
packages, so generation runs locally without a system protoc or a Buf account.

```sh
pnpm proto:generate  # regenerate TypeScript
pnpm proto:check     # lint, format check, and compile schemas
pnpm type-check
pnpm test           # Chrome mapping and binary/JSON round trips
```

Development, builds, type checks, and tests regenerate the models automatically.
Run `pnpm exec buf format -w` after editing schemas. For compatibility checks
against an existing Git revision, use `pnpm exec buf breaking --against '.git#ref=main'`
(replace `main` with the intended baseline).

`src/utils/browserModels.ts` maps Chrome API objects into schema-backed domain
snapshots. `src/types/browser.ts` derives application types from generated
messages; services, workspace tab snapshots, and UI use these types. Chrome
request parameters remain Chrome API types. Screenshots remain a UI extension
of the generated tab model.

IDs are signed, session-scoped browser IDs. Optional fields preserve missing
IDs and permission-restricted metadata; `group_id = -1` means ungrouped.
Browser status, color, type, and state values use strings to preserve browser
values. Window tabs are empty when the browser response was not populated.

Chrome messaging and storage continue to use plain JSON objects with camelCase
fields. They do not use Protobuf JSON field names or binary transport. To encode
a snapshot as Protobuf, first reconstruct a message with its generated schema:

```ts
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { TabSchema } from './src/gen/browser/v1/browser_pb';

const message = create(TabSchema, tabSnapshot);
const bytes = toBinary(TabSchema, message);
const decoded = fromBinary(TabSchema, bytes);
```

Keep field numbers stable when evolving schemas; reserve deleted numbers and
names. Workspace persistence retains its existing format.
