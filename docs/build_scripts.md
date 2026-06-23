## Electron doesnt work and fails on build server

Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
pnpm store prune
pnpm install
pnpm approve-builds
pnpm rebuild electron
pnpm exec electron -v
pnpm dev

## Electron version change & build

pnpm remove electron
pnpm add -D electron@33
pnpm approve-builds
pnpm rebuild electron
pnpm exec electron -v

## Electron better-sqlite3 doesnt work

pnpm add -D @electron/rebuild
pnpm exec electron-rebuild -f -w better-sqlite3
