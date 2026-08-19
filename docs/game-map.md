# Game Map & Rendering

The in-game map is a single MapLibre GL instance (via `react-map-gl/maplibre`) mounted by `src/Game/Map/World.jsx`, with every gameplay layer added as a React child that declares its own `<Source>`/`<Layer>`. All political state flows in from `world.json` (polled every 5s by `useWorldState`) and `colors.json` (the owner→rgb palette); nothing on the map is server-rendered — owners are recoloured, labels rebuilt, and units/markers re-fed from that JSON every poll. The same code renders two ways: a flat Web-Mercator map and a decorative 3D globe (with a real-sun terminator and starfield), switched by the `projection` prop, which remounts the whole `<Map>`.

Everything below is in `src/Game/Map/` unless noted.

---

## 1. Component tree & data sources

`World.jsx` renders one `<Map>` and, inside it, these children (order = paint order, later = on top):

| Child | File | Renders | Primary data in |
|---|---|---|---|
| `<Nations>` | `Nations.jsx` | Country/region fills, borders, disputed stripes, country/owner labels | `world.json` + `colors.json` + PMTiles + `regionsGeojson` |
| `<Cities>` | `Cities.jsx` | City symbols (★/◆/■) + labels | `cities.pmtiles` (stock) or `citiesGeojson` (custom) |
| `<MarkersLayer>` | `MarkersLayer.jsx` | Built structures (bases, silos, embassies…) | `world.markers` |
| `<Units>` | `Units.jsx` | Troop counters (circle + glyph + strength) | `unitsController` (from `world.units`) |
| `<GlobeEffects>` | `GlobeEffects.jsx` | Sun, stars, day/night lighting, auto-rotation (globe only) | wall-clock sun math |
| `<RegionPopup>` / `<CountryInfoPanel>` / `<UnitPopup>` / `<FeaturePopup>` | `../Selection/*` | Selection popups | click events from `Nations.jsx` |

### Shared state hooks

| Hook | File | What it provides |
|---|---|---|
| `useWorldState()` | `useWorldState.js` | Singleton 5s poll of `world.json`; one poll shared by all consumers |
| `useCustomBackground()` | `useCustomBackground.js` | Resolves a scenario's uploaded image/vector basemap from `world.background` |
| `useMapSetting(key)` | `../../runtime/mapSettings.js` | Reactive localStorage map toggles (`hideCountryLabels`, `disableIdleRotation`) |
| `unitsController` | `unitsController.js` | Separate 5s poll of `world.units` + player order mutations |

`useWorldState` is a module-level singleton: `startPolling()` fires one `setInterval(poll, 5000)` reading `JSON_URLS.world`, and all mounted consumers subscribe. It returns a **stable object identity** across polls when nothing it exposes changed (deep/shallow compares each field — arrays like `markers`/`regionClaimants` are `JSON.stringify`-compared) so React children don't re-render on every 5s tick. See [World state](world-state.md) for the `world.json` schema.

Fields `useWorldState` derives from `world.json`:

| Field | Source key | Used by |
|---|---|---|
| `worldKnown` | `Object.keys(state).length > 0` | Gate: stock layers only paint once the world is known |
| `customRegions` (`customFlag`) | `state.customRegions` | Switches stock↔custom render path |
| `customCities` | `state.customCities` | `Cities.jsx` stock↔custom path |
| `basemap` | `state.basemap` | ESRI style variant |
| `background` | `state.background` | Uploaded image/vector basemap descriptor |
| `regionOwnershipOverrides` | `state.regionOwnershipOverrides` | region id → owner name (live conquests) |
| `regionClaimants` | `state.regionClaimants` | region id → claimant list (disputed stripes) |
| `polityOverrides` | `state.polityOverrides` | polity name → `{name, color, aliases}` registry |
| `markers` | `state.markers` | `MarkersLayer.jsx` |
| `labelFont` / `labelHaloColor` / `labelTextColor` | same | Label styling |

> **Note on the `customRegions` flag:** `readRuntimeJsonAsset` / `normalizeRuntimeWorld` forces `customRegions:true` onto every world it serves. In practice the game is *always* on the custom render path (`customFlag` true); the stock-country path (`showStockCountries`) is effectively dead — see [§4](#4-owner-colouring--the-single-resolver) and the `countries-source` note.

---

## 2. `<Map>` setup and key props

Defined in `World.jsx` (`src/Game/Map/World.jsx:286`). The `<Map>` has `key={projection}`, so **toggling globe↔mercator unmounts and remounts the entire map** (and all its GL images — which is why disputed stripe tiles are rebuilt reactively, see [§5](#5-disputed--striped-regions)).

| Prop | Value | Why |
|---|---|---|
| `key` | `projection` | Remount on projection change |
| `initialViewState` | `{longitude:0, latitude:0, zoom:3.5, bearing:0, pitch:0}` | Kept in `viewStateRef` and updated on every `onMove` so a remount restores the camera |
| `minZoom` | `2.25` | Deliberate floor (see [§10](#10-zoom-caps--why-theyre-deliberate)) |
| `maxZoom` | `16` | Deliberate ceiling; PMTiles overzoom past their z8 max |
| `maxBounds` | `[[-Inf,-80],[Inf,85]]` | Lock latitude to the usable band; longitude free (world copies wrap) |
| `doubleClickZoom` | `false` | Double-click is reserved for gameplay |
| `dragRotate` / `touchPitch` / `pitchWithRotate` | `false` | No bearing/pitch — top-down only |
| `dragPan` | on | Pan enabled |
| `cursor` | `"default"` | No grab cursor |
| `attributionControl` | `false` | Hidden |
| `fadeDuration` | `0` | No label cross-fade flicker |
| `collectResourceTiming` | `false` | Skip perf-entry overhead |
| `crossSourceCollisions` | `false` | Symbols from different sources don't fight for placement (cities vs labels vs markers) |
| `renderWorldCopies` | on | Wrap the map E/W infinitely |
| `maxTileCacheSize` | `256` | **Caps per-source retained-tile GPU textures** |
| `projection` | `useMemo(() => ({type: projection}))` | `"globe"` or `"mercator"` |
| `terrain` | memoized (below) | 3D terrain, flat non-custom maps only |
| `mapStyle` | `worldStyle` (`buildWorldStyle(...)`) | Base ESRI/terrain OR custom background |

Handlers: `onMove` → stores `viewState` in `viewStateRef` + `applyDynamicPixelRatio`; `onIdle` → fires `onInitialIdle` once (boot signal) and clears the loading toast; `onLoading` → shows a "Loading tiles…" toast with an 8s safety timeout.

### `maxTileCacheSize={256}` (the OOM cap)

Left unset, MapLibre sizes this cache dynamically to roughly `(ceil(w/256)+1)*(ceil(h/256)+1)*5` tiles **per source** — ~270 at 1080p but ~800 on a 4K viewport. With `renderWorldCopies`, panning E/W feeds successive wrapped world-copy tiles into that cache, so retained GPU textures climb until the tab OOMs. `256` caps the 4K case ~3× while being a no-op on phones. In-view tiles are a separate structure and are never evicted by this, so on-screen tiles are never re-fetched. This is orthogonal to `applyDynamicPixelRatio` (which bounds framebuffer pixels, not tiles).

### Dynamic pixel ratio (`applyDynamicPixelRatio`, `World.jsx:212`)

Zoomed far out, the whole world (every region, border, label) draws at once and native resolution wastes frames on invisible detail. So:

| Zoom | Mode | `map.setPixelRatio(...)` |
|---|---|---|
| ≤ 4.5 | `low` | `min(devicePixelRatio, 1) * 0.75` |
| ≥ 5 | `native` | `window.devicePixelRatio` |
| 4.5–5 | unchanged | hysteresis band to prevent flapping |

Applied on `onMove` **and** `onIdle`, so the soft ratio is in effect from the very first settled frame at world zoom, not only after the first pan.

### `terrain` memo (`World.jsx:197`)

`terrain = { source: "terrain-source", exaggeration: 15 }` **only** when `terrainEnabled && !isGlobe && !customBg && !bgDeclared`. Globe terrain is unsupported by MapLibre and can corrupt the shader cache across projection changes, so it's disabled on the globe and on any custom-background map (which has no terrain source).

---

## 3. The base style (`buildWorldStyle`)

`buildWorldStyle(basemapId, customBg, backgroundDeclared, isGlobe)` (`World.jsx:57`) returns a MapLibre style JSON. It picks **one of four** branches:

| # | Condition | Sources | Layers |
|---|---|---|---|
| 1 | `customBg.kind === "image"` | `custom-bg` (image, corners per `WORLD_IMAGE_COORDS_*`) | `custom-bg-base` (solid `#0b1a2b`), `custom-bg-layer` (raster) |
| 2 | `customBg.kind === "vector"` | `custom-bg-vec` (geojson) | `custom-bg-sea` (bg), `custom-bg-fill` (per-feature `fill`), `custom-bg-line` |
| 3 | `backgroundDeclared` (payload not loaded yet) | none | `custom-bg-loading` (solid `#0b1a2b`) |
| 4 | default (stock world) | ESRI satellite + terrain (below) | satellite + hillshade |

Branches 1–3 **drop ESRI entirely** so a custom-map game never flashes satellite Earth or fires basemap tile requests it won't use. Branch 3 is the pre-load placeholder: `useCustomBackground` flips `declared:true` from the light `world.json` poll *before* the heavy background payload loads.

Every branch sets `sky: { "atmosphere-blend": 0 }` — MapLibre's uniform atmosphere is off because `GlobeEffects` supplies directional surface light instead, and transparent space lets the stars/sun show through the canvas.

### Default stock style (branch 4)

| Source id | Type | Tiles / template | Notes |
|---|---|---|---|
| `satellite-lowres` | raster | `esriTileTemplate(basemapId)` | z0–2 always have real data; `maxzoom:2` |
| `satellite` | raster | `basemapProtocolTemplate(basemapId)` → `ohbase://…` | High-res via the **ohbase protocol** so ESRI "Map Data Not Yet Available" placeholders get replaced with upscaled ancestor tiles; `maxzoom` = the basemap's native max |
| `terrain-source` | raster-dem | `TERRAIN_TILE_TEMPLATE` (AWS terrarium) | `encoding:"terrarium"`, `maxzoom:5` |
| `hillshade-source` | raster-dem | same terrarium tiles | for the `hills` layer |

Layers: `satellite-lowres-layer`, `satellite-layer` (both with `SATELLITE_PAINT` grading — brightness cap, slight desaturation/contrast so it sits against the dark UI), and `hills` (hillshade, exaggeration 0.1). The default basemap is `DEFAULT_BASEMAP_ID = "ocean"`; the in-game basemap picker was removed, so stock worlds are fixed to that preset. `ensureBasemapProtocol()` (called at module load) registers the `ohbase://` protocol handler. Basemap helpers live in `src/runtime/assets.js` (`ESRI_BASEMAPS`, `esriTileTemplate`, `basemapProtocolTemplate`, `basemapMaxZoom`).

### World-image corner coordinates

Two constants (`World.jsx:44`) give the image-source corners:

- `WORLD_IMAGE_COORDS_FLAT` — ±85.0511° (the Mercator projection limit).
- `WORLD_IMAGE_COORDS_GLOBE` — ±89.9° (the globe shows to the poles; **not** exactly ±90 because `mercatorYfromLat(±90)` is ±Infinity and `ImageSource.setCoordinates` throws — the `custom-bg-base` layer fills the negligible sliver).

`styleUsesGlobeCoords = customBg?.kind === "image" && isGlobe` selects between them.

---

## 4. Region & country layers (`Nations.jsx`)

`Nations.jsx` (the `WorldMap` component) declares four sources. The core idea is a **crossfade**: at low zoom, GADM region *fills* come from a coarse seed GeoJSON (`regionsGeojson`); past z6.5 they hand off to crisp stock vector tiles (`regions.pmtiles`). Author-drawn/edited geometry always comes from the GeoJSON, on top.

### 4.1 Sources & layers

| Source id | Type | Data | Gated on | Layers |
|---|---|---|---|---|
| `countries-source` | vector | `PMTILES_PROTOCOL_URLS.countries`, `maxzoom 8` | `!customFlag` | `countries-fill`, `countries-outline` |
| `regions-source` | vector | `PMTILES_PROTOCOL_URLS.regions`, `maxzoom 8` | **never gated** | `regions-fill`, `regions-disputed`, `regions-outline` |
| `custom-regions-source` | geojson | `enrichedCustomRegionData`, `tolerance 0` | inert unless `customActive` | `custom-regions-fill-far`, `custom-regions-hairline-far`, `custom-regions-disputed-far`, `custom-regions-fill`, `custom-regions-disputed`, `custom-regions-outline` |
| `country-leader-line-source` | geojson | `activeLeaderLineData` (empty on every built board since 2026-08-18 — the owner lane draws no leader lines) | — | `country-leader-lines` |
| `country-curved-label-source` | geojson | `activeCurvedLabelData` (stock lane — empty on every built board) | — | `country-curved-labels` |
| `country-point-label-source` | geojson | `activePointLabelData` (the owner lane, all ranks) | — | `country-labels`, `country-labels-leaders`, `country-labels-minor`, `country-labels-curved` (§7.2) |

**`countries-source` is dead code by design.** Its `countries-fill` uses `fillStyle`, whose `match` is the only expression that keys on a country **code** (`["get","GID_0"]`). Because `customRegions` is forced true everywhere, `showStockCountries` (`worldKnown && !customFlag`) is always false and the source never mounts. It's left intact (not half-fixed) for a future dead-code sweep. The layer that actually paints the political map is `regions-fill` via `stockRegionsFillPaint`, which matches `GID_1` (a region id) and needs no code→name bridge.

**`regions-source` is NOT gated on `customFlag`** — this is load-bearing. On a re-ownership scenario (Modern Day, Rome, WWII: stock GADM geometry, nothing hand-drawn) `regions-fill` is the *only* thing painting owners above z6.5, because `custom-regions-fill-far` stops at `maxzoom 7` and `FAR_FILL_FADE` has already faded it to 0 by z6.5. Unmounting it once left every such map blank past 6.5 and (via the `getLayer()` filter in the click handler) unclickable too.

### 4.2 The crossfade constants

| Constant | Value | Meaning |
|---|---|---|
| `FAR_FILL_FADE` | interpolate zoom 5.5→0.72, 6.5→0 | seed-GeoJSON fill opacity (fades **out** on zoom in) |
| `TILE_FILL_FADE` | interpolate zoom 5.5→0, 6.5→0.72 | stock-tile fill opacity (fades **in**) |
| `GADM_GEOMETRY_FILTER` | `index-of "." in id >= 0` | GADM region (dotted id like `USA.1_1`) |
| `CUSTOM_GEOMETRY_FILTER` | `index-of "." in id == -1` | author-drawn (`reg_…`, no dot) |
| `AUTHORED_GEOMETRY_FILTER` | `custom OR edited==true` | geometry that lives **only** in the GeoJSON |
| `STOCK_GEOMETRY_FILTER` | `GADM AND edited!=true` | unedited GADM → paints via tiles |

The crossfade band is z5.5–6.5 because the seed geometry was extracted at tile-zoom 5; hand-off happens just past that. The **`edited` split** matters: a GADM region the editor *reshaped* has a dotted id but its true shape is now in the GeoJSON, while the stock tile still carries the *original* shape. Painting both stacks two 0.72 fills and darkens the reshaped area, so edited GADM ids are pulled out of the tile layers (`editedStockIds`, computed in `Nations.jsx:949`) and rendered from the GeoJSON like author-drawn shapes.

### 4.3 Fill / outline paint objects

| Layer | Paint driver | Behaviour |
|---|---|---|
| `regions-fill` | `stockRegionsFillPaint` | `match GID_1 → ownerColorCss(owner)` for every non-drawn, non-edited region; opacity `TILE_FILL_FADE` (0 unless `customActive`) |
| `regions-outline` | `regionsOutlinePaint` | black hairline; width `interp 3→0.2, 8→0.6, 12→1.0`; opacity fades in `5.5→0, 6.5→0.6, 8→0.7` (only when the tile fills do — below that the seed hairlines carry it); excludes `editedStockIds` |
| `custom-regions-fill-far` | `["get","_fillColor"]` | seed-GeoJSON fill for GADM regions, `maxzoom 7`, opacity `FAR_FILL_FADE` |
| `custom-regions-hairline-far` | — | seed hairlines that sit exactly on the far fills, hand off at z6.5 |
| `custom-regions-fill` | `["get","_fillColor"]` | author-drawn/edited geometry, opacity constant `0.72` at all zooms |
| `custom-regions-outline` | — | black outline for authored geometry, opacity `3→0, 4→0.35, 8→0.6` |

`_fillColor` is **pre-baked into each GeoJSON feature** by `enrichedCustomRegionData` (`Nations.jsx:852`) so the GL paint expression is the constant `["get","_fillColor"]` — a match expression that never recompiles when ownership changes. The colour per feature is: override colour (`regionOwnershipOverrides[id]`) → owner colour (`ownerColorCss(props.owner)`) → `NEUTRAL_LAND_COLOR = rgb(88,98,110)`.

---

## 5. Owner colouring — the single resolver

There is **one** owner→rgb resolver, `resolveOwnerRgb(owner)` (`Nations.jsx:727`), used by every paint path (region fills, stripes, and — via `ownerColorCss` — labels). Owners are **names now** (`"Russia"`, `"Roman Empire"`), not GADM codes. Resolution order:

1. `colorMap[owner]` — exact hit in `colors.json` (loaded by `getNationColors`).
2. `parseColorToRgb(polityOverrides[owner].color)` — the live polity registry from `world.json` (stores CSS strings; `colors.json` stores `[r,g,b]` triplets, so `parseColorToRgb` bridges the two namespaces).
3. Case/diacritic/punctuation-folded match (`ownerFoldKey`) against `colorMap` keys, then against `polityOverrides` keys **and their `aliases`**.
4. `fallbackRgbFromOwner(owner)` — a procedural hash of the first three A–Z letters.

The two-namespace merge is the whole point: a polity can be correctly *named* by the registry while `colors.json` has no key for it (shipped example: "British Empire" owns 426 regions in `world-war-ii-1939-copy` with its colour only in `polityOverrides`). Resolving the name but not the colour painted those regions a muddy procedural fallback — reading to players as "the map didn't annex it."

`ownerColorCss(owner)` wraps it into a `rgb(...)` string (or `NEUTRAL_LAND_COLOR`). `fallbackRgbFromOwner` strips to A–Z first so accented/two-word names hash usefully instead of collapsing to a dark corner; it's the JS twin of `buildFallbackColorExpression` (which still hashes the *code* off the stock tiles, because tile properties are baked GADM and never become names).

### Palette live-reload

`colors.json` can be rewritten mid-game (every AI turn, or the faction creator writing the player's colour). `getNationColors` memoizes on the scenario token and won't see a runtime write, so the asset layer dispatches a `oh:colors-updated` window event on write; `Nations.jsx` listens (`colorsEpoch`) and re-reads. `shallowEqualColors` guards against swapping in a fresh object with identical contents, which would needlessly rebuild every MapLibre match expression.

---

## 6. Disputed / striped regions

A region whose `claimants` list names contesting countries renders **diagonally striped** in their colours (current administrator's band first).

| Piece | Location | Role |
|---|---|---|
| `stripeImageId(rgbList)` | `Nations.jsx:158` | Encodes the rgb list into an image id: `oh-stripes-r_g_b-r_g_b…` |
| `parseStripeImageId(id)` | `Nations.jsx:160` | Decodes it back |
| `buildStripeImage(rgbList)` | `Nations.jsx:173` | Raw RGBA diagonal-stripe tile; band = `(x+y) mod period` (tiles seamlessly), `STRIPE_BAND_PX = 8` |
| `styleimagemissing` handler | `Nations.jsx:512` | On demand, builds and `addImage`s any stripe tile the style asks for |

Because the image id **encodes its own colours**, the `styleimagemissing` handler can rebuild *any* combination — including after a globe↔mercator remount wipes all GL images. This is why stripes are reactive rather than pre-registered.

Claimants come from `world.regionClaimants[id]` first (how the modern-world scenario declares disputes, since its geometry is an immutable seed), else the region feature's own `claimants` prop (editor maps). `enrichedCustomRegionData` bakes a `_stripes` property (the image id) onto disputed features; layers select on `["has","_stripes"]` and paint with `fill-pattern` instead of the solid fill:

- `custom-regions-disputed-far` — seed geometry, `FAR_FILL_FADE`.
- `custom-regions-disputed` — authored geometry, constant `0.72`.
- `regions-disputed` — the tile twin for GADM disputed regions (uses `disputedTileStops`, opacity `TILE_FILL_FADE`), excluding `editedStockIds`.

`DISPUTED_TERRITORY_CLAIMANT` (`Nations.jsx:338`) maps GADM's `Z01`–`Z09` disputed codes (Kashmir, Aksai Chin, Arunachal Pradesh…) to a claimant country so the map shows `"Disputed (India)"` instead of a bare `"Z01"` label.

---

## 7. Country / owner labels

Two label lanes exist in `Nations.jsx`; **one of them draws.** `normalizeRuntimeWorld` forces `customRegions` on every served world (24 of 24 built boards), so the `customFlag` branch is the whole of what a player sees, and the stock lane's sources stay empty everywhere:

| State | Point labels | Leader lines | Curved glyphs |
|---|---|---|---|
| `!worldKnown` | empty | empty | empty (no flash before load) |
| `customFlag` — **every built board** | `ownerLabelData` (owner lane, the ranks below) | `ownerLeaderLineData` — **empty since 2026-08-18** (the owner lane retired leader labels; see 7.1 step 7) | inside `ownerLabelData` (`curved: 1` features) |
| stock world (never reached) | `pointLabelData` | `leaderLineData` | `curvedLabelData` |

The stock lane — `src/runtime/countryLabels.js`, `loadCountryLabelCollections` reading the z0 tile of `countries.pmtiles` — labels *modern* countries, which is wrong on scenario maps (it printed "Russia"/"Ukraine" over the USSR). It is kept for the shared geometry it exports (`lngLatToTile`, the area-moment axis helpers, `AXIS_ELONGATION_FLOOR`) and its own cache key (`country-labels-v3`); the owner lane below is what this section is about.

### 7.1 The owner lane — `buildOwnerLabelCollection` (`Nations.jsx`)

One label per **owner per contiguous territory**, built as a pure function of the region GeoJSON, `regionOwnershipOverrides`, `polityOverrides`, a name resolver and the memoized adjacency. It recomputes as ownership polls in, so **labels follow conquests**; `labelEpoch` (bumped on `i18n:updated`) forces a rebuild when translations land. The pure geometry and paint live in five runtime modules, tested without the map by `tests/label-leaders.mjs` (54 pins) and `tests/label-names.mjs`:

| Module | Owns |
|---|---|
| `src/runtime/labelNames.js` | which of a polity's names prints (`pickDisplayAlias`) |
| `src/runtime/labelClusters.js` | which regions touch (`buildRegionAdjacency`), which piece carries the label (`snapshotClusterPart` / `largestClusterPart`), which cluster is the seat (`seatIndex`), where on the piece the label sits (`placeLabelInPiece`), and box overlap (`labelBox`, `boxesOverlap`) |
| `src/runtime/labelLeaders.js` | name width in em (`nameWidthEm`, `wrapNameLines`, `widestLineEm`) and the fit (`fitNameToTerritory`, no floor); the promotion floor and leader-line placement (`buildLeaderPlacement`, `leaderPlacementCandidates`) that only the stock lane still asks for |
| `src/runtime/labelCurves.js` | the curved rung (`buildClusterCurvePath`, `layoutGlyphsAlongPath`, `tileToLngLat`) |
| `src/runtime/labelPaint.js` | the zoom-and-feature paint expressions — the fade window (`buildCountryTextOpacity`, `LABEL_FADE_IN_PX`/`LABEL_FADE_OUT_PX`) and the leader-line opacity (`buildLeaderLineOpacity`) — written as MapLibre composites (`perZoomStops`) and validated against MapLibre's own style spec in the tests |

The steps, in the order the builder runs them:

**1. Owner and name.** A region's owner is `regionOwnershipOverrides[id] ?? properties.owner`, canonicalised through `toCountryName` (an AI capture writes the code `"ESP"`, the seed writes the name `"Spain"`; both must land in one cluster). GADM's disputed slivers `Z01–Z09` print as `Disputed (<claimant>)` (`DISPUTED_TERRITORY_CLAIMANT`). The raw name is `polityOverrides[owner].name || countryNameByCode.get(owner) || owner`, and the resolver the component passes is **spec first**: `pickDisplayAlias(polityOverrides[owner].aliases, language) ?? translateLabel(resolveCountryDisplayName(raw, owner))`. On a Korean client that is the polity's first Hangul alias — the string the preset author wrote ("바이에른 왕국"), not the translation pack's guess ("바바리아 왕국") — and only a polity with no alias in the player's script (a Latin-script language, a base country with no polity entry) falls through to the old path. `tests/preset-display-alias.mjs` holds the fleet to the convention that `aliases[0]` is the Korean display name (decision 2026-08-17; every board has been filled). The result is uppercased.

**2. One entry per region**: the centroid, area (deg²) and area-moment axis of its **largest ring** (the axis is accumulated in tile space, where the text is drawn — reading member centroids instead stood SPAIN on end and laid ITALY flat). A bounding box used to ride along for the leader-line placement; it went with that lane.

**3. Adjacency** — `buildRegionAdjacency` (`labelClusters.js`), geometry-only and memoized per world, so it survives ownership polls. Two regions touch when any two of their vertices lie within `REGION_ADJACENCY_DEGREES = 1e-2°`. It used to be a shared vertex on a 1e-4° grid, which is how GADM's provinces meet inside one country and not how two countries' outlines meet: measured on 1836, cross-border gaps are digitising noise under 1e-4° with a tail of river borders up to ~6e-3°, and the misses were real (Prussia's Polish provinces stop 2.2e-4° short of Brandenburg; Jutland and Schleswig 1.9e-3° apart). 1e-2° sits between the widest real border gap and the first same-owner pair that genuinely is apart (Incheon–Kaesong, 1.8e-2°), and it is only ever consumed *within* one owner. Flat typed-array grid, CSR-indexed, cells four epsilons wide: 1.7 s for 1836's 3.2 M vertices, against 2.6 s for the hash it replaced.

**4. Clusters.** Union-find over same-owner adjacent regions gives one cluster per contiguous territory — contiguity, not distance, is what keeps a colony apart from its metropole (France vs French West Africa) while a touching chain like Siberia stays one label. `mergeOwnerClusters` then folds clusters whose centroids lie within `CLUSTER_JOIN_DEGREES = 10` (islands onto their mainland; at 3° Japan splits into three labels and Britain into two), and each merge keeps a snapshot of the pieces it folded — position, weight and region list — as `parts`.

**5. Seat and tier.** Clusters sort largest first, then `seatIndex` moves the **home** cluster to the front: the preset builder writes each polity's `home` (the first country in its grants — `"GBR"` for Britain, `"DNK"` for Denmark) and the seat is the cluster holding the most regions cut from that country. Before this the seat was simply the largest cluster, which named an empire after its biggest possession (59 cases across the fleet: Denmark's seat was Greenland on six boards, 1836 Britain's the Columbia District, Portugal's Mozambique). Index 0 is the seat — `tier: 0`, full weight, the only cluster offered the curve; everything after it is a possession, `tier: 1` — **every detached piece, however small** (the old `MIN_CLUSTER_AREA = 1.5` deg² bar was retired 2026-08-19: the zoom-size fade already keeps a tiny repeat off the screen until it can be read, so the bar only bought islands with no name at any zoom; fleet tier-1 repeats 513 → 1,378, build time inside noise). Only a degenerate cluster with no measurable area skips. A polity without a home keeps the largest.

**6. Anchor.** The label's provisional position is the centroid of the cluster's **largest contiguous piece** (`largestClusterPart`), not the merged centroid — which for an archipelago is the sea and for a country with an exclave leans toward it (Bavaria's label sat west toward the Palatinate, on Württemberg's; Two Sicilies' in the Tyrrhenian). Only the position comes from the piece; size, tier, tilt and the rings a curve may run through still read the whole cluster.

**7. Size, and the ladder.** `ownScale = √area × 17500` is the label's weight (`buildCountryTextSize` draws it at `areaScale × 2^(zoom − 16)` px). Its tilt is the cluster's principal axis when the axis means something — elongation ≥ `AXIS_ELONGATION_FLOOR = 1.4`, read off wwii-1935's 109 seats — else 0. **Every name is sized to its own country and printed inside it, at whatever size that takes** — the player's decision of 2026-08-18, against the original as it draws today (its 2020 board, checked the same day: KINGDOM OF CAMBODIA on two small lines inside Cambodia, LAO PEOPLE'S DEMOCRATIC REPUBLIC tiny along Laos, JAPAN large along Honshu, nothing out on a line at a size the country did not earn). Two rungs, each the original's:

| Rung | When | What is emitted |
|---|---|---|
| **Curved** | seat only, and the flat name would not fit: `widestLineEm(name) > NAME_FIT_EM × √elongation` — or, after placement (step 8), a seat whose flat label sits on its land nowhere (`landCoverage < LABEL_CURVE_LAND_COVERAGE = 0.8`: Honshu, Vietnam's S, the Solomons) | `buildOwnerCurve` traces a centreline through the cluster's own rings along the same axis, and `layoutGlyphsAlongPath` emits **one Point feature per glyph** (`curved: 1`), sized to fill the path and capped at `ownScale` — **no floor**: a long name on a small long country bends along it small; the shape-driven kind is laid compact and centred on the path (`maxPerEm`) since its name is short; no curve if the path is too fat (width ratio > 0.7), kinks past 40° or turns more than 30° between neighbouring glyphs (Honshu's "일본 제국" stays flat) — GRAND-HESSE and SAXE-WEIMAR on the original's 1836 board are this rung |
| **Flat** | everything else | one Point feature at `fitNameToTerritory(ownScale, name, tilt ? elongation : 1)` — the size at which the *player's* string (the alias, wrapped as MapLibre wraps it) fits across the territory, **shrunk as far as that takes** |

**The leader-line rung is retired** (2026-08-18). Until then a seat under `LEADER_AREA_SCALE_FLOOR = 20000` (San Marino scores 589; Danzig 9,116) went outside its shape on a hairline, horizontal, at a fixed `LEADER_LABEL_AREA_SCALE = 30000` — larger than the floor, so a micro-state's name out on its line stood nearly as tall as Johor's inside Johor, and its placement pass (C-1: 80 colliding pairs → 4) is what the git history holds (`a229c5a` … `ed2d954`). What replaces it is not a bigger font but the paint: `text-opacity` fades a label in as it reaches legible size on screen (7.2), so Luxembourg's name is absent at the zoom that shows Europe and present, in place, at the zoom that shows Luxembourg — the original's REPUBLIC OF KOREA. Fleet, the 548 seats that were on lines: 267 now sit wholly on their own land flat, 240 flat with a corner over the border (mean 91% on land; the archipelagos — Bahamas, Cape Verde, the Marshalls — are the tail), 41 bend (22 by shape, 19 by width); they reach 12 px between z5.3 and z11.1 (median z7.3; Nauru and Tokelau last). Label pairs that would show at the same zoom and overlap: 6 → 1 (the Mamluk–Hejaz corner on 1444). The stock lane (`countryLabels.js`) still promotes and still owns the constants and `buildLeaderPlacement`; the player's `labelLineExtension` dial (map settings) reaches only that lane now — on a built board it moves nothing.

A **possession prints at its own weight** — the rank cue is the minor layer's `MINOR_LABEL_SCALE = 0.6`, not a cap. There was a cap (a repeat could not out-print the seat); it never bit while the seat was the largest cluster and bit hard once the seat was the home cluster (Greenland's DENMARK fell to a tenth of its size). Checked against the original on 2026-08-18: it caps nothing — DENMARK is drawn across Greenland at Greenland's size while Denmark proper carries no name at that zoom.

**8. Placement — `placeLabelInPiece`.** The anchor is a good spot only while the piece is convex; it is in Bosnia for Croatia, in Sweden for Norway, inside Lesotho for South Africa, in the Ogaden for Somalia, and on the fleet's 2,947 flat labels only 61% sat wholly on their own land at the anchor (77 had the anchor off it altogether). So the builder makes a second pass once every label is known: it rasterises the piece — its member regions' largest polygons, projected once per world into tile space (`projectedPieceOf`, a `WeakMap`) and scan-filled `LABEL_FIT_CELLS = 256` wide — erases every other label box the map will draw (curved glyphs, the other flat labels at their current spots) as off-land, and samples the label's own rectangle (wrapped width × `wrapNameLines(name).length × LABEL_LINE_HEIGHT_EM`, at its tilt, 21 × 5 points) against it. A label ≥ 99.9% on its land stays exactly where it is; otherwise it moves to the spot maximising `coverage − LABEL_FIT_PULL (0.03) × distance in em` — the least move that fixes it, searched only within the reach where the pull can still lose. The pole of inaccessibility was measured and rejected: it maximises an inscribed circle and drifts to the roundest bulge, where a long tilted label wants the middle of the long axis. Fleet, with this code: wholly-inside 61% → 88%, mean 94% → 99%, 39% of labels move (median 0.48 em, p90 1.9 em), label-on-label overlaps 34 → 2, leader labels covered by a neighbour's name 66 → 36 (measured while the leader rung still existed). A seat that still keeps under 80% of its label on the piece is offered the curve (step 7) and, if the shape has a path for it, its flat feature is replaced by the glyphs. Since 2026-08-18 every seat goes through this pass — the small ones that used to leave on a leader line included. The pass is ~100 ms per rebuild on 1836 (the builder is ~550 ms without it); the curved rung is never re-placed.

**9. Output.** `{ labels, leaderLines }` — the label features carry `name` (or `glyph`), `areaScale`, `rotation`, `tier`, `leader` (always 0 from this lane now; the layers route on it), `curved` and `lat` (for the globe correction). `leaderLines` is an empty collection: it stays because the source and layer are shared with the stock lane, whose lines carry `name` and `ownScale`. Two collections because they are two sources.

### 7.2 Layers & styling

| Source | Data | Layers |
|---|---|---|
| `country-leader-line-source` | `activeLeaderLineData` (empty on every built board) | `country-leader-lines` — `line`, the label colour at half strength, fading on **how big the country draws** (`ownScale × 2^(zoom−16)`: 0.38 at 20 → 0 at 60), not on zoom — written as a composite (`buildLeaderLineOpacity`), because MapLibre allows `["zoom"]` only as the input of a top-level `interpolate`/`step`: the first version had it inside the arithmetic, the layer was refused on every style pass, and no leader line ever drew (found on the live screen 2026-08-18) |
| `country-curved-label-source` | `activeCurvedLabelData` (stock lane; empty on every built board) | `country-curved-labels` |
| `country-point-label-source` | `activePointLabelData` | four `symbol` layers filtered on the property that names each rank — see below |

**Four layers, one source**, because `text-allow-overlap` is layout-only and constant-only (a data expression there is rejected on every style pass and every label falls back to `false`), and size, halo and `text-field` are per-layer too:

| Layer | Filter | Layout / paint difference | Overlap |
|---|---|---|---|
| `country-labels` | `leader != 1 && tier != 1 && curved != 1` | full size, halo 1 | **allowed** — a country standing on its own ground always draws |
| `country-labels-leaders` | `leader == 1` | full size, horizontal | culled — the stock lane's promoted labels would smear; the owner lane emits none since 2026-08-18, so the layer is empty on every built board |
| `country-labels-minor` | `tier == 1 && …` | `text-size × MINOR_LABEL_SCALE`, halo 0.5 (a 1 px halo on a 40%-smaller face reads as a bolder blob) | culled, and **drawn last** so a repeat yields to the country's own name |
| `country-labels-curved` | `curved == 1` | `text-field: glyph`, per-glyph `rotation` | allowed |

Shared layout (`pointLabelLayoutBase`): `text-font` = `[world.labelFont || "Impact", "Arial Black", "sans-serif"]` (a CSS font-family drawn locally — MapLibre v5 has no glyphs endpoint here); `text-size` = `buildCountryTextSize(1, isGlobe)`, exponential in zoom, scaled by each feature's baked `areaScale`, capped at 254; `text-rotate` = `["get","rotation"]`; `text-letter-spacing` = `LABEL_LETTER_SPACING = 0.12` — **layout, not paint** (in paint MapLibre answered "unknown property" 76 times per page load and the tracking never reached the screen); `text-pitch-alignment`/`text-rotation-alignment` `"map"`, `text-keep-upright: false`; `visibility: none` under the `hideCountryLabels` map setting. Paint: `world.labelTextColor || "#FFFFFF"`, halo `world.labelHaloColor || "rgba(0,0,0,0.5)"`, and **`text-opacity` = `buildCountryTextOpacity(multiplier, globe correction, 0.75)`** (`labelPaint.js`) — a window on the label's **own on-screen font size**, `multiplier × areaScale × 2^(zoom−16)` px, the very product `text-size` takes: nothing under `LABEL_FADE_IN_PX = [6, 12]` px, full 0.75 across the reading band, nothing past `LABEL_FADE_OUT_PX = [100, 200]`. Measured on the original 2026-08-18 (JAPAN across Honshu solid at ~90 px, half gone at ~150, gone before ~280; REPUBLIC OF KOREA solid at 13 px, drawn at 8, absent at 6). It replaces a flat 0.75, which had replaced a zoom ramp (0.75 at z5 → 0 at z8, which made LATVIA three times fainter than the city labels at z≈6.8 — the original draws it solid there, and still does: that zoom sits inside the band). Written as a composite — one output expression per integer zoom under a top-level `interpolate` on `["zoom"]` — because that is the only place MapLibre allows `["zoom"]`; the minor layer gets the same window at `MINOR_LABEL_SCALE`, or a repeat would fade in 40% early. This is what makes the size-to-country rule (7.1 step 7) readable: a hundred small states' names a pixel high at Europe's zoom are simply not there.

**Globe text-size fix (issue #6):** globe projection oversizes a label's own high-latitude text relative to its outline. `GLOBE_LAT_CORRECTION = cos(feature.lat × π/180)` undoes it, applied via `buildCountryTextSize(…, correctForGlobe = true)` **only** in globe mode (the factor is visibly wrong in Mercator). Every label feature carries its own `lat` for this — the placement pass moves it with the label.

### 7.3 Measuring, and the units

Everything above was set by measurement rather than by eye, and the numbers are in the code comments and `docs/WORKLOG.md` (2026-08-16 → 18). What to remember when re-measuring:

- **Name width is measured in em, wrapped as MapLibre wraps.** `text-max-width` defaults to 10 em (Nations.jsx does not set it) and `text-line-height` to 1.2 em (`LABEL_MAX_WIDTH_EM`, `LABEL_LINE_HEIGHT_EM`); a full-width Hangul glyph is 1 em, an upper-case Latin glyph 0.55 (`NAME_FIT_CHAR_WIDTH`), plus the tracking. `NAME_FIT_EM ≈ 4.76` em is how many em cross a territory of the label's own weight; measure the string the player sees (the alias), not the English key.
- **One em is `areaScale / 8192` tile units** (extent 4096) — the same at every zoom, because text and map both scale by `2^z` — so overlap and fit are measured in tile space without picking a zoom; tier-1 is `× 0.6`. Rotation in that plane is MapLibre's clockwise `text-rotate`.
- **Pass the adjacency**, or the clusters are not the game's; the builder's own probe (the pure section of `Nations.jsx` run in Node against `regions.geojson` + `world.json`) is how the fleet numbers were taken. Boards without their own `regions.geojson` borrow Modern Day's (`libraryStore.js`).
- **The fade is in px, measured on the same monitor as the game.** The thresholds in `labelPaint.js` came from screenshots of the original at successive zooms, reading glyph height in CSS px and eyeballing opacity (solid / half / gone); a 2560-px-wide window at DPR 1. Re-measure the same way if the original changes, and keep them in px — a zoom threshold would break the moment a label of a different size crossed it.
- The original (paxhistoria.co) is the reference for *what* to draw — prefixes ("KINGDOM OF BAVARIA"), the curved rung, uncapped possessions, letterspacing, every name inside its own shape at the size that fits, the fade — and this lane departs from it exactly once, by decision: the original prints a label at its centroid (UNITED KINGDOM and JAPAN in the Pacific), this one at the nearest spot where the name sits on the land it names.

---

## 8. Cities & markers

### Cities — `Cities.jsx`

`<Cities>` picks a path from `world.customCities`:

| Path | Source | Visibility filter | Sort |
|---|---|---|---|
| `StockCities` | `cities.pmtiles` (vector, layer `cities`) | `populationFilter` — capitals always; else population thresholds that step down as you zoom (2.5M at z<5 → 100k at z8+) | by population |
| `CustomCities` | `citiesGeojson` (geojson) | dots: `customTierFilter` — authored tier: 4=capital, 3=major, 2=city (z≥4.3), 1=town (z≥5.8). names: `customLabelTierFilter` on top — capitals always, tier 3 z≥5, tier 2 z≥6, towns z≥7, **on/off in the filter, never a fade** (an opacity-0 label would still own its collision box) | `customSortKey` (tier then population) |

Custom scenarios never show the 70k modern database (anachronistic), and while the custom set loads they render nothing rather than flash modern names. Both paths use the same visual language and the same two layers (`minzoom 3.4`):

- `cities-shapes` — a glyph per city: `★` capital / `◆` major / `■` other (transparent text, white halo, so only the outline shows).
- `cities-labels` — the city name (`Open Sans Semibold`, white with dark halo). One fixed anchor (`top`: the name hangs below its dot) — this was `text-variable-anchor` over four spots and names jumped between them as neighbours came and went ("들쭉날쭉", reported 2026-08-18); a name that cannot fit its one spot is collision-dropped instead, which reads calmer. Stock names gate like the custom lane: capitals always, ≥2.5M z≥5, rest z≥6 (`stockLabelGateFilter`).

### Markers (built structures) — `MarkersLayer.jsx`

Fed from `world.markers` (structures founded during play — bases, silos, embassies…). Each valid marker (`Number.isFinite(lng/lat) && name`) becomes a Point feature. Shape by keyword: `MILITARY_KIND` regex → `▲`, else `■`. Colour by owner via `ownerColorString(colorMap, ownerCode)` (from `getNationColors`; unowned = neutral parchment `rgb(226,222,205)`). Two layers: `markers-shapes` (glyph, owner-coloured) and `markers-labels` (`minzoom 2.6`).

---

## 9. Units (troops)

### Render — `Units.jsx`

`units-source` (geojson) is fed from `unitsController.getUnits()`. Each unit → a Point feature with a `TYPE_GLYPH` (`infantry:I, armor:A, air:F, naval:N, artillery:G, garrison:C`) and an owner colour. Three stacked layers:

| Layer | Type | Encodes |
|---|---|---|
| `units-fill` | circle | owner colour; radius scales with zoom |
| `units-icons` | symbol | the type glyph |
| `units-strength` | symbol | numeric strength, offset below (`minzoom 3`) |

Status drives styling — **pending** (player-requested, not yet AI-confirmed) units are translucent (`circle-opacity 0.32`) with a blue stroke; **moving** = amber stroke; **engaged** = red stroke; else white.

### Controller — `unitsController.js`

A module-level store, separate from `useWorldState` but with the same 5s cadence (`startUnitsSync`). It holds `units`, `playerCode`, `round`, `gameDate`, `allowedUnitTypes`, and an `interactionMode` (`idle | deploy | move | attack`), plus a `subscribeUnits` pub/sub the map/popups/Forces panel listen to.

| Function | Effect | Instant feedback | AI hand-off |
|---|---|---|---|
| `deployUnit` | Add a `pending` unit (translucent) | placed locally | queues a "Deploy request" order; revert = remove |
| `moveUnitTo` | Within era/type leash → move + `moving`; beyond `moveLeashKm` → stay put, `moving` | snaps or holds | queues Move / Long-range order |
| `attackWith` | In `engagementRangeKm` → `resolveClash` (seeded, instant); out of range → approach order | strength/positions update, losers filtered out | queues Attack order (`regionTransfer` hint) |
| `attackFeature` | Attack a city/marker; no local clash — positional only | closes on objective, reads `engaged` | queues assault order (`markerOps`/`regionTransfer` hints) |

Player deploy is purely local; move/attack write to `world.units` immediately **and** queue a machine-readable `action` (via `queueOrder`) so the AI honours/contests them on the next time-jump. `queueOrder` records a `unitRevert` so deleting the queued action before the jump undoes the on-map change (#368). Combat maths (`resolveClash`, `distanceKm`, `engagementRangeKm`, `moveLeashKm`) live in `unitCombat.js`. `busy` suppresses the poll from clobbering an in-flight commit.

### Interaction dispatch — `Nations.jsx` `handleRegionClick`

The map's single `click` handler (`Nations.jsx:564`) routes by `getInteractionMode()`:

- **deploy/move/attack modes** intercept the click as a *target* (`deployUnit` / `moveUnitTo` / `attackWith` or `attackFeature`), then `clearInteractionMode()`.
- **normal click** priority: unit (`units-fill`) → feature (`markers-shapes` > `cities-shapes`/`cities-labels`) → region. Region query uses `["custom-regions-fill","custom-regions-fill-far"]` on drawn-geometry maps but `["custom-regions-fill","regions-fill"]` on re-ownership maps (so a click on fantasy ocean resolves to nothing, not the leftover real country underneath — `hasDrawnGeometry`). The resolved region is handed to `onRegionSelected` with the **owner name** resolved (via `ownerLookupRef`), the underlying GADM `gid0` kept as a flag fallback.

The staged-reveal system (`setUnitsOverride` / `setWorldStateOverride`) lets the map show units/world as of the last revealed event during a turn's event playback, snapping back to live state when cleared (see [World state](world-state.md) and the turn/time system).

---

## 10. The decorative globe (`GlobeEffects.jsx`)

Active only when `projection === "globe"` (`active` prop). It drives four things, all outside MapLibre's own render: the sun sprite (`#oh-globe-sun`), the starfield canvas (`#oh-globe-stars`), the day/night lighting canvas (`#oh-globe-lighting`), and idle auto-rotation. Those DOM elements are declared in `World.jsx` around the transparent `<Map>` canvas so the globe provides correct sun occlusion.

- **Real sun:** `sunWorldPosition = subsolarPoint()` — the actual subsolar point for the current wall clock (seasonal declination + Earth's rotation). Moving the camera changes perspective without sliding light across the countries; the terminator matches the planet outside your window. `LIVE_SUN_REFRESH_MS = 60_000` refreshes it even when the map is fully idle.
- **Auto-rotation:** `ROTATION_DEG_PER_MS = 360 / (10 min)`. Disabled by the `disableIdleRotation` map setting, and interrupted by any drag/zoom/pointerdown.
- **Aggressive idle throttling (the main perf lever):** while actively dragging/zooming, sun+lighting+stars redraw at 60 fps; while idle (including auto-rotate) they drop to ~15 fps (`*_FRAME_MS_IDLE`), and the auto-rotate `jumpTo` itself steps at 15 fps (`IDLE_ROTATE_FRAME_MS`) using real elapsed time so rotation *speed* is unchanged. Idle auto-rotate previously forced a full MapLibre re-render + from-scratch lighting repaint 60×/s forever — this was cooking phones.
- **Projection morph:** the globe↔mercator morph fades stars/lighting via `projectionTransition` (1 on settled globe, 0 on flat, between only mid-fade). The morph fires no map "move" event, so `isMorphing` forces full-rate redraws during the fade; only the settled globe throttles.
- **WebGL context loss** is handled: on `webglcontextlost` it cancels the rAF loop and releases the canvases; on restore it resyncs and resets the rotation clock so the first tick doesn't jump the globe by the whole lost interval.

Sun/star/lighting math is in `globeSunMath.js`, `globeCanvasLighting.js`, `globeCelestialCanvas.js` (with `globeLightingPixels.js`, `globeCelestialCanvas.js`, `globeSunMath.js`).

---

## 11. Zoom caps & why they're deliberate

| Cap | Where | Rationale |
|---|---|---|
| `minZoom 2.25` | `<Map>` | World-view floor |
| `maxZoom 16` | `<Map>` | Camera ceiling; past PMTiles' z8 the tiles overzoom |
| `maxBounds` lat `-80…85` | `<Map>` | Keep the camera in the usable latitude band |
| PMTiles `maxzoom 8` | `countries-source`, `regions-source` | **Not the archive's z10.** `extract-regions.mjs` can't stitch a z10 seed (dies in `JSON.stringify` past V8's 512 MB max string); z9's 4.1 M vertices OOM'd the editor renderer; z8's 2.6 M is stable — and rendering finer than the editor can author only draws detail no map can be built against. MapLibre overzooms past z8. |
| `custom-regions-fill-far maxzoom 7` | seed-GeoJSON far layer | Stops just past the z5.5–6.5 crossfade; the stock tiles own the crisp zoom |
| Crossfade band z5.5–6.5 | `FAR_FILL_FADE`/`TILE_FILL_FADE` | Seed extracted at tile-zoom 5; hand off just past it |
| Pixel-ratio switch z4.5 / z5 | `applyDynamicPixelRatio` | Soften the whole-world view; hysteresis prevents flapping |
| Cities `minzoom 3.4`, city thresholds step by zoom | `Cities.jsx` | Thin out symbols as you zoom out |
| Label `text-opacity` = a window on the label's own on-screen px (in 6→12, out 100→200, peak 0.75), `text-size` capped at 254 px | `buildCountryTextOpacity` (`labelPaint.js`), `buildCountryTextSize` | Country/owner labels fade on their **own size**, not on zoom: absent until legible, solid across the reading band (the original draws LATVIA solid at z≈6.8 — the old zoom ramp left it three times fainter than the city labels), gone once they outgrow the screen (JAPAN across Honshu). Measured on the original 2026-08-18. The size cap still stops a name smearing where no window reaches |
| Markers labels `minzoom 2.6` | `MarkersLayer.jsx` | Structure names appear slightly earlier than cities |

---

## 12. Data-flow summary

```
world.json ──(useWorldState, 5s)──► customRegions, regionOwnershipOverrides,
   │                                 regionClaimants, polityOverrides, markers,
   │                                 labelFont/Color, basemap, background, units
   │
   ├─► Nations.jsx ──► enrichedCustomRegionData (_fillColor/_stripes baked in)
   │                   ownerLabelData (+ an empty ownerLeaderLineData) (per-owner, follows
   │                   conquests; adjacency memoized on the geometry, each label
   │                   placed on its own piece — §7)
   │                   stockRegionsFillPaint (GID_1 → owner colour)
   │
   ├─► useCustomBackground ──► buildWorldStyle (image/vector/placeholder/ESRI)
   ├─► MarkersLayer ──► markers-source
   └─► unitsController (own 5s poll of world.units) ──► Units.jsx / popups

colors.json ──(getNationColors, oh:colors-updated event)──► colorMap
   └─► resolveOwnerRgb ──► every fill / stripe / label / marker / unit colour

regionsGeojson / citiesGeojson ──(readJson, force)──► custom region & city geometry
countries.pmtiles / regions.pmtiles / cities.pmtiles ──► stock tile geometry
   └─► countryLabels.js (z0 countries tile) ──► point + curved stock labels
```

Every owner recolour, label rebuild, and unit/marker update is a consequence of a `world.json` (or `colors.json`) change surfacing through the 5s polls — there is no push channel; the map is a pure function of that polled state plus the static per-scenario geometry.

### Cross-references

- [World state](world-state.md) — the `world.json` schema, `regionOwnershipOverrides`, `polityOverrides`, `regionClaimants`, `markers`, `units`, staged-reveal overrides.
- Runtime asset layer (`src/runtime/assets.js`) — `JSON_URLS`, `PMTILES_PROTOCOL_URLS`, the `ohbase://` protocol, `getNationColors`, `resolveCountryDisplayName`, scenario-token cache sweeping.
- Selection popups (`src/Game/Selection/*`) — consumers of `onRegionSelected` / `onFeatureSelected` / `onUnitSelected`.
