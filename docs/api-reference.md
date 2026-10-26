# API reference

The TypeDoc configuration in `typedoc.json` generates reference documentation for the public modules under `lib/` and `hooks/`.

## Generate locally

With Node.js 24 and project dependencies installed, run:

```sh
npx --yes typedoc@0.28.14
```

The generated static site is written to `docs/api/`. The **API reference** workflow also builds the site on demand (Actions → API reference → Run workflow) and uploads it as the `typedoc-api-reference` artifact.

The generated output is intentionally not committed. This keeps source changes reviewable and avoids large generated diffs. The workflow artifact can be downloaded and opened locally; a future Pages publishing step can be enabled once repository Pages permissions and deployment ownership are confirmed.
