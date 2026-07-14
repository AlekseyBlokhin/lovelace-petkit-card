# Contributing

Thanks for considering a contribution to `lovelace-petkit-card`.

## Requesting support for a new PETKIT device

This repo's maintainer only owns a **PETKIT PURAMAX**, so the card's config
schema, device-status vocabulary (`event_labels`), and status/control
defaults are all written against that device's entities. Supporting a
different PETKIT device (a different litter box model, a feeder, a
fountain, etc.) requires community-contributed data — the maintainer has no
way to know what entities/attributes another device exposes, or how its
firmware reports state, without someone who owns it providing that.

To request support for a new device:

1. Open a
   [New device support request](../../issues/new?template=new-device-support.yml)
   issue.
2. Include, at minimum:
   - The exact device model/name.
   - Which Home Assistant integration exposes it.
   - A full dump of every entity the device creates in Home Assistant (from
     **Settings → Devices & Services → your device → entities**, or the
     **Developer Tools → States** page filtered to your device).
   - Example state/attribute JSON for its 2-3 most interesting sensors
     (**Developer Tools → States**, select the entity, see "Attributes").
   - Whether you're willing to test a work-in-progress build against your
     real device — this matters a lot, since the maintainer can't otherwise
     verify anything works.
3. If you already have a hand-built dashboard/automation for the device,
   include it — it's the best signal for what data actually matters to real
   users of that device.

## Adding a new device card yourself

If you'd rather submit the implementation directly: this repo ships one
bundle (`dist/petkit-puramax-card.js`) containing every card + editor
`customElements.define()`'d from `src/index.js`, and there is a **single
`hacs.json` for the whole repo** — a new device card is an additional
custom element registered in the same bundle/release, not a separate
package or a separate `hacs.json`.

To add e.g. a `feeder` card:

1. Create `src/cards/feeder/` mirroring `src/cards/puramax/` (`*.js`,
   `*-editor.js`, `*.styles.js`, `*.const.js`).
2. Reuse `src/lib/*` for anything generic (history parsing, day/analytics
   math, chip display, HA service helpers) — it's deliberately
   device-agnostic (`events`/`entityIds`, not `visits`/`catEntities`).
   Don't duplicate logic that already exists there; if something's missing
   and would benefit both device cards, add it to `src/lib/` instead of
   copy-pasting into the new card.
3. Register the new card + its editor in `src/index.js`, alongside the
   PURAMAX ones.
4. Add unit tests for any new `src/lib` logic and component tests for the
   new card/editor, matching the structure under `test/`.
5. Update the README with a config reference section and example for the
   new device, and update its "Supported devices" section.

Open a PR — see the CI workflow (`lint`, `typecheck`, `test`, `build`) for
what needs to pass.

## Development

```sh
npm install
npm run test:watch   # vitest, watch mode
npm run lint
npm run typecheck
npm run build         # outputs dist/petkit-puramax-card.js (ESM)
```

There are no runtime dependencies — the build is a single esbuild bundle,
and tests run under Vitest + happy-dom (a DOM implementation, not a real
browser) so they run fast and don't need Home Assistant itself.
