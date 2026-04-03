# Country Dash

## Stack

- React 19
- Vite 8
- TanStack Router
- MUI 7
- NiceModal
- Vitest
- Playwright

## Development

```bash
pnpm install
pnpm dev
```

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## Deployment

The app is configured for GitHub Pages using GitHub Actions. The Vite `base`
path is set automatically for CI builds.

## Geodata

Runtime map assets are served from `public/data/`:

- `public/data/world-topo.json`
- `public/data/world-topo-110m.json`

Source artifacts remain in the repository root for regeneration and reference.

Example generation commands:

```bash
ogr2ogr -f GeoJSON world.json ne_50m_admin_0_countries.shp
topojson --id-property ISO_A3 -p nameEn=NAME_EN,name=NAME,abbr=NAME_SHORT,formalName=FORMAL_EN,nameAlt=NAME_ALT,isocode=ISO_A2,isocode3=ISO_A3 -o public/data/world-topo-110m.json world.json
topojson --id-property ISO_A3 -p nameEn=NAME_EN,name=NAME,abbr=NAME_SHORT,formalName=FORMAL_EN,nameAlt=NAME_ALT,isocode=ISO_A2,isocode3=ISO_A3 -o public/data/world-topo.json world.json
```
