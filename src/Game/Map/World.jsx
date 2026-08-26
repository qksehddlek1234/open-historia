/*! Open Historia — portions (troop system integration + globe sun/stars) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import Nations from "./Nations";
import { useCustomBackground } from "./useCustomBackground.js";
import GlobeEffects from "./GlobeEffects.jsx";
import RegionPopup from "../Selection/Regions";
import CountryInfoPanel from "../Selection/CountryPanel.jsx";
import RegionInfoPanel from "../Selection/RegionPanel.jsx";
import Cities from "./Cities";
import Units from "./Units";
import UnitPopup from "../Selection/Units";
import MarkersLayer from "./MarkersLayer.jsx";
import FeaturePopup from "../Selection/Features.jsx";
import {
  MAP_SETTING_KEYS, useDisplayScale, useMapChoice, useMapRenderValue, useMapSetting,
} from "../../runtime/mapSettings.js";
import {
  DEFAULT_BASEMAP_ID,
  OHM_BASEMAP_ID,
  OHM_STYLE_URL,
  TERRAIN_TILE_TEMPLATE,
  basemapMaxZoom,
  basemapProtocolTemplate,
  ensureBasemapProtocol,
  esriTileTemplate,
} from "../../runtime/assets.js";
import { readGameData } from "../../runtime/gameState.js";
// OHM's own date plugin. NOT a side-effect import: the package only patches
// Map.prototype.filterByDate when a GLOBAL maplibregl exists (a <script> tag
// world), and in a bundled app it takes its CommonJS branch and exports plain
// functions instead — the live console proved it, `filterByDate is not a
// function` on every styledata. The named export takes the map as its first
// argument and works in any module world.
import { filterByDate as filterOhmByDate } from "@openhistoricalmap/maplibre-gl-dates";

// The high-res source goes through the ohbase protocol so ESRI's "Map Data
// Not Yet Available" placeholders get replaced with upscaled ancestor tiles.
ensureBasemapProtocol();

// Every source THIS game mounts (react children on the map). On the OHM
// basemap, symbol layers from any OTHER source are the base style's own
// labels and are hidden — the game supplies its own political labels.
const OWN_MAP_SOURCES = new Set([
  "countries-source", "countries-fill-source", "regions-source",
  "custom-regions-source", "custom-regions-far-source", "diverged-borders-source",
  "country-curved-label-source", "country-point-label-source",
  // Province names (2026-08-25). THIS LIST IS THE GATE: the sweep below hides
  // every symbol layer whose source is not listed here, so a new game source
  // with a symbol layer that is missing from this set ships invisible — that is
  // exactly how region-labels arrived dead on its first build. Fill layers on
  // unlisted sources are unaffected (the sweep only touches type "symbol").
  "region-label-source",
  "cities-source", "cities-label-source",
  "markers-source", "markers-label-source",
  "units-source", "units-label-source",
]);

// THE OHM STYLE, TAKEN APART BEFORE IT MOUNTS. Handing react-map-gl the raw
// style URL worked, but the live console showed what it costs per session:
// hundreds of 404s from static-tiles.openhistoricalmap.org (the style's
// ohm_landcover_hillshade raster backdrop is only sparsely pre-rendered — most
// tiles at most zooms simply do not exist), plus a glyph 404 for nearly every
// Latin range (OHM's font server lacks whole ranges even of its own fonts,
// and our political labels asked it for theirs too). So the style is fetched
// once and rebuilt:
//   • symbol layers dropped at the source — the game supplies its own labels
//     ("지도에 써있는 글자들은 싹 없애줘"), and dropping beats hiding because
//     hidden layers still trigger glyph fetches and a flash before styledata;
//   • raster sources and their layers dropped — the vector data is the point,
//     and the sparse raster backdrop was pure 404 noise;
//   • the glyphs endpoint removed — with no OHM symbol layers left, nothing
//     needs a font server, and MapLibre then rasterizes OUR labels from local
//     fonts exactly as it does on every other basemap this game runs.
// If the fetch fails, the raw URL is the fallback and the styledata scrub
// below still hides the labels the old way.
// Who each border belongs to. Two of these are licence conditions rather than
// courtesies: EuroGeographics (NUTS) and the ONS Open Geography Portal (OGL).
// OpenHistoricalMap is CC0 and needs none, and is credited anyway because the
// era outlines are the most distinctive thing on the map.
const MAP_DATA_CREDIT = [
  "Boundaries: GADM",
  "© EuroGeographics (NUTS)",
  "ONS/OGL",
  "OpenHistoricalMap (CC0)",
].join(" · ");

const transformOhmStyle = (style) => {
  const sources = {};
  const rasterSources = new Set();
  for (const [key, source] of Object.entries(style?.sources ?? {})) {
    if (source?.type === "raster") rasterSources.add(key);
    else sources[key] = source;
  }
  const layers = (Array.isArray(style?.layers) ? style.layers : [])
    .filter((layer) => layer?.type !== "symbol" && !rasterSources.has(layer?.source));
  const next = { ...style, layers, sources, sky: { "atmosphere-blend": 0 } };
  delete next.glyphs;
  return next;
};

let ohmStylePromise = null;
const loadOhmStyle = () => {
  if (!ohmStylePromise) {
    ohmStylePromise = fetch(OHM_STYLE_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(transformOhmStyle)
      .catch((error) => {
        // Do not cache the failure — a transient outage must not pin the
        // fallback for the whole session.
        ohmStylePromise = null;
        throw error;
      });
  }
  return ohmStylePromise;
};

// Neutral placeholder while the OHM style loads — same idea as the declared-
// background placeholder: never flash the satellite Earth under an era map.
const OHM_LOADING_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "ohm-loading", type: "background", paint: { "background-color": "#0b1a2b" } }],
  sky: { "atmosphere-blend": 0 },
};

// Grading applied to whichever ESRI basemap is picked: cap brightness so it
// sits against the dark UI, with a little desaturation/contrast that suits both
// the satellite imagery and the paler cartographic styles.
const SATELLITE_PAINT = {
  "raster-resampling": "linear",
  "raster-saturation": -0.15,
  "raster-contrast": 0.08,
  "raster-brightness-min": 0.02,
  "raster-brightness-max": 0.78,
};

// Full-map image corners (TL, TR, BR, BL). The flat mercator map only reaches
// ±85.0511° (the projection limit), but the globe shows all the way to the poles
// — so on the globe the image stretches nearly to ±90° to cover the pole caps.
// NOT exactly ±90: mercatorYfromLat(±90) is ±Infinity, which makes MapLibre's
// ImageSource.setCoordinates throw — so we stop a hair short (the custom-bg-base
// layer fills the negligible remaining sliver).
const WORLD_IMAGE_COORDS_FLAT = [
  [-180, 85.0511],
  [180, 85.0511],
  [180, -85.0511],
  [-180, -85.0511],
];
const WORLD_IMAGE_COORDS_GLOBE = [
  [-180, 89.9],
  [180, 89.9],
  [180, -89.9],
  [-180, -89.9],
];

const buildWorldStyle = (basemapId, customBg, backgroundDeclared, isGlobe) => {
  // A custom uploaded map replaces the ESRI basemap entirely — no satellite or
  // terrain tiles load at all (saves those requests), the uploaded map is the
  // base layer, and the regions/labels from <Nations> paint on top of it.
  if (customBg?.kind === "image" && customBg.imageUrl) {
    return {
      version: 8,
      sources: {
        "custom-bg": {
          type: "image",
          url: customBg.imageUrl,
          coordinates: isGlobe ? WORLD_IMAGE_COORDS_GLOBE : WORLD_IMAGE_COORDS_FLAT,
        },
      },
      layers: [
        // Solid base beneath the image so no edge/pole ever shows a transparent hole.
        { id: "custom-bg-base", type: "background", paint: { "background-color": "#0b1a2b" } },
        { id: "custom-bg-layer", type: "raster", source: "custom-bg", paint: { "raster-fade-duration": 0 } },
      ],
      sky: { "atmosphere-blend": 0 },
    };
  }
  if (customBg?.kind === "vector" && customBg.geojson) {
    return {
      version: 8,
      sources: { "custom-bg-vec": { type: "geojson", data: customBg.geojson } },
      layers: [
        { id: "custom-bg-sea", type: "background", paint: { "background-color": "#0b1a2b" } },
        // A fill layer only draws (Multi)Polygons, so no geometry-type filter is
        // needed — and the old "Polygon"-only filter silently dropped the dissolved
        // MultiPolygon biomes, so the basemap rendered nothing. Each feature carries
        // its own biome colour in `fill`.
        { id: "custom-bg-fill", type: "fill", source: "custom-bg-vec", paint: { "fill-color": ["coalesce", ["get", "fill"], "#33435c"] } },
        { id: "custom-bg-line", type: "line", source: "custom-bg-vec", paint: { "line-color": "rgba(0,0,0,0.18)", "line-width": 0.4 } },
      ],
      sky: { "atmosphere-blend": 0 },
    };
  }
  // A background is declared but its payload hasn't loaded yet — show a neutral
  // placeholder (no ESRI/terrain sources) so a custom-map game never flashes
  // satellite Earth or fires basemap tile requests it won't use.
  if (backgroundDeclared) {
    return {
      version: 8,
      sources: {},
      layers: [{ id: "custom-bg-loading", type: "background", paint: { "background-color": "#0b1a2b" } }],
      sky: { "atmosphere-blend": 0 },
    };
  }
  return {
  version: 8,
  sources: {
    "satellite-lowres": {
      type: "raster",
      // Levels 0-2 always have real data — no placeholder handling needed.
      tiles: [esriTileTemplate(basemapId)],
      tileSize: 256,
      maxzoom: 2,
    },
    satellite: {
      type: "raster",
      tiles: [basemapProtocolTemplate(basemapId)],
      tileSize: 256,
      maxzoom: basemapMaxZoom(basemapId),
    },
    "terrain-source": {
      type: "raster-dem",
      tiles: [
        TERRAIN_TILE_TEMPLATE,
      ],
      encoding: "terrarium",
      maxzoom: 5,
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "satellite-lowres-layer",
      type: "raster",
      source: "satellite-lowres",
      paint: SATELLITE_PAINT,
    },
    {
      id: "satellite-layer",
      type: "raster",
      source: "satellite",
      paint: SATELLITE_PAINT,
    },
    {
      id: "hills",
      type: "hillshade",
      source: "terrain-source",
      paint: {
        "hillshade-exaggeration": 0.1,
        "hillshade-shadow-color": "#000",
      },
    },
  ],
  // MapLibre's uniform atmosphere is off; GlobeEffects supplies directional
  // surface light instead. Transparent space lets the stars and sun show.
  sky: {
    "atmosphere-blend": 0,
  },
  };
};

function World({ mapRef, projection, terrainEnabled, onInitialIdle }) {
  const hasReportedInitialIdleRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const loadTimerRef = useRef(null);
  const viewStateRef = useRef({
    longitude: 0,
    latitude: 0,
    zoom: 3.5,
    bearing: 0,
    pitch: 0,
  });
  // A custom uploaded map (image or vector) replaces the ESRI basemap entirely.
  // Otherwise: the PLAYER'S pick wins, then whatever the scenario asked for, then
  // the ocean default. The picker used to not exist at all — ten basemaps shipped
  // fully wired and every campaign ran on the default because nothing could set
  // the key.
  // `declared` flips on from the light world.json poll (before the heavy payload)
  // so the map drops ESRI immediately rather than flashing satellite Earth.
  const { background: customBg, declared: bgDeclared, basemap: worldBasemap } = useCustomBackground();
  const chosenBasemap = useMapChoice(MAP_SETTING_KEYS.basemapStyle);
  // HOW FAR ONE WHEEL CLICK GOES. MapLibre has no zoom-rate prop, so this is
  // applied to the live handler after the map exists — see the effect below.
  const zoomSensitivity = useDisplayScale("zoomSensitivity");
  // THE TWO CAMERA DIALS FROM THE ORIGINAL'S RENDERING PAGE.
  //
  // renderWorldCopies repeats the planet east and west without end. That is
  // right for a globe you spin and wrong for a board you are reading: pan past
  // the dateline and the same war is drawn twice on one screen. Off by default,
  // because the endless map is also what makes a Pacific campaign legible.
  //
  // maxBounds pens the camera. The shipped rectangle is the whole world minus
  // the poles (Mercator cannot draw them), so a player who turns the limit on
  // without moving the edges sees no change — the same "1.0 is as shipped"
  // rule the display multipliers follow.
  const hideParallelWorlds = useMapSetting(MAP_SETTING_KEYS.hideParallelWorlds);
  const limitWorldBounds = useMapSetting(MAP_SETTING_KEYS.limitWorldBounds);
  const boundsWest = useMapRenderValue("worldBoundsWest");
  const boundsEast = useMapRenderValue("worldBoundsEast");
  const boundsSouth = useMapRenderValue("worldBoundsSouth");
  const boundsNorth = useMapRenderValue("worldBoundsNorth");
  const cameraBounds = useMemo(() => {
    // An inverted or zero-area rectangle would lock the camera to a point, so
    // it falls back to the unlimited default rather than trapping the player.
    const usable = limitWorldBounds && boundsEast > boundsWest && boundsNorth > boundsSouth;
    if (!usable) return [[-Infinity, -80], [Infinity, 85]];
    return [[boundsWest, boundsSouth], [boundsEast, boundsNorth]];
  }, [limitWorldBounds, boundsWest, boundsEast, boundsSouth, boundsNorth]);
  const isGlobe = projection === "globe";
  const mapProjection = useMemo(() => ({ type: projection }), [projection]);
  const styleUsesGlobeCoords = customBg?.kind === "image" && isGlobe;
  // The OHM basemap swaps the WHOLE base style for OpenHistoricalMap's own
  // stylesheet (a URL — react-map-gl accepts one), date-filtered to the
  // campaign below. Our political layers are react children, so they mount on
  // top of it exactly as they do on the homegrown style. A scenario's own
  // uploaded background still wins: that map IS the world, whatever basemap
  // taste says.
  const activeBasemap = chosenBasemap || worldBasemap || DEFAULT_BASEMAP_ID;
  const ohmActive = activeBasemap === OHM_BASEMAP_ID && !customBg && !bgDeclared;
  // The transformed OHM style object once fetched; the raw style URL if the
  // fetch failed (old behaviour, scrub-on-styledata); null while loading.
  const [ohmStyle, setOhmStyle] = useState(null);
  useEffect(() => {
    if (!ohmActive) return undefined;
    let cancelled = false;
    loadOhmStyle()
      .then((style) => { if (!cancelled) setOhmStyle(style); })
      .catch((error) => {
        console.warn("[basemap] could not fetch the OHM style for rebuilding — using it as-is:", error);
        if (!cancelled) setOhmStyle(OHM_STYLE_URL);
      });
    return () => { cancelled = true; };
  }, [ohmActive]);
  const worldStyle = useMemo(
    () => (ohmActive
      ? (ohmStyle ?? OHM_LOADING_STYLE)
      : buildWorldStyle(activeBasemap, customBg, bgDeclared, styleUsesGlobeCoords)),
    [activeBasemap, ohmActive, ohmStyle, customBg, bgDeclared, styleUsesGlobeCoords],
  );

  // THE DATE IS THE POINT. An OHM basemap that ignores the campaign clock
  // would draw 21st-century motorways under a 1936 war — the plugin filters
  // every OHM feature to the campaign's current date, re-applied on every
  // styledata (style swaps rebuild layers) and whenever a turn moves the
  // clock. Polling matches the world poll's cadence; when OHM is off this
  // effect is inert.
  const [ohmDate, setOhmDate] = useState("");
  useEffect(() => {
    if (!ohmActive) return undefined;
    let cancelled = false;
    const readDate = () => {
      readGameData({ force: false })
        .then((game) => {
          if (cancelled) return;
          const date = String(game?.gameDate || game?.startDate || "").trim();
          if (date) setOhmDate(date);
        })
        .catch(() => {});
    };
    readDate();
    const timer = setInterval(readDate, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [ohmActive]);
  useEffect(() => {
    if (!ohmActive || !ohmDate) return undefined;
    const map = mapRef?.current?.getMap?.();
    if (!map) return undefined;
    const apply = () => {
      try {
        filterOhmByDate(map, ohmDate);
      } catch (error) {
        console.warn("[basemap] could not date-filter the OHM basemap:", error);
      }
      // THE BASEMAP KEEPS ITS GEOGRAPHY AND LOSES ITS WORDS. OHM ships its own
      // place and country labels, which fight the game's political labels for
      // the same pixels in another language. Every symbol layer that is not
      // OURS goes invisible; ours are recognized by their sources, so a layer
      // this game adds later is safe by construction.
      try {
        for (const layer of map.getStyle()?.layers ?? []) {
          if (layer.type !== "symbol" || OWN_MAP_SOURCES.has(layer.source)) continue;
          if (map.getLayoutProperty(layer.id, "visibility") !== "none") {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        }
      } catch (error) {
        console.warn("[basemap] could not hide the OHM basemap labels:", error);
      }
    };
    if (map.isStyleLoaded?.()) apply();
    map.on("styledata", apply);
    return () => map.off("styledata", apply);
  }, [ohmActive, ohmDate]);
  // Globe terrain is unsupported by MapLibre and can leave its shader cache invalid
  // when projections change. Keep the setting enabled and restore it on flat maps.
  const terrain = useMemo(
    () =>
      terrainEnabled && !isGlobe && !customBg && !bgDeclared && !ohmActive
        ? {
            source: "terrain-source",
            exaggeration: 15,
          }
        : null,
    [terrainEnabled, isGlobe, customBg, bgDeclared],
  );
  // Render at reduced pixel density when zoomed far out: the whole-world view
  // draws every region, border and label at once, and full native resolution
  // there spends frames on detail nobody can see at that scale. Hysteresis
  // (re-sharpen at 5, soften below 4.5) prevents flapping at the boundary.
  const pixelRatioModeRef = useRef(null);
  const applyDynamicPixelRatio = useCallback((zoom) => {
    const map = mapRef?.current?.getMap?.();
    if (!map || typeof map.setPixelRatio !== "function") return;
    const mode = zoom <= 4.5 ? "low" : zoom >= 5 ? "native" : pixelRatioModeRef.current;
    if (!mode || mode === pixelRatioModeRef.current) return;
    pixelRatioModeRef.current = mode;
    const native = window.devicePixelRatio || 1;
    map.setPixelRatio(mode === "low" ? Math.min(native, 1) * 0.75 : native);
  }, [mapRef]);

  const handleMove = useCallback(({ viewState }) => {
    viewStateRef.current = viewState;
    applyDynamicPixelRatio(viewState.zoom);
  }, [applyDynamicPixelRatio]);
  const handleIdle = useCallback(() => {
    // The soft ratio applies from the very first frame settled at world zoom —
    // not only after the player first moves the camera.
    applyDynamicPixelRatio(viewStateRef.current?.zoom ?? 0);
    if (hasReportedInitialIdleRef.current) return;
    hasReportedInitialIdleRef.current = true;
    onInitialIdle?.();
    setLoading(false);
  }, [applyDynamicPixelRatio, onInitialIdle]);
  const handleLoading = useCallback(() => {
    setLoading(true);
    clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setLoading(false), 8000);
  }, []);

  // ZOOM SENSITIVITY. react-map-gl exposes no rate prop, and MapLibre keeps the
  // wheel rate on the live scrollZoom handler, so it is set on the instance —
  // whenever the setting changes and once whenever the map is rebuilt (a
  // projection switch replaces it, which is what `key={projection}` does).
  //
  // The defaults are MapLibre's own (1/100 per wheel delta, 1/450 per trackpad
  // pixel); the setting scales both so a wheel and a trackpad move together.
  useEffect(() => {
    const map = mapRef?.current?.getMap?.();
    const scrollZoom = map?.scrollZoom;
    if (!scrollZoom?.setWheelZoomRate) return;
    scrollZoom.setWheelZoomRate((1 / 450) * zoomSensitivity);
    scrollZoom.setZoomRate((1 / 100) * zoomSensitivity);
  }, [zoomSensitivity, mapRef, projection, loading]);

  return (
    // Stars and the single projected sun sit behind the transparent MapLibre
    // canvas, so the globe itself provides correct sun occlusion.
    <div
      id="oh-globe-space"
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isGlobe && (
        <canvas
          id="oh-globe-stars"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      )}
      {isGlobe && (
        <div
          id="oh-globe-sun"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 88,
            height: 88,
            borderRadius: "50%",
            pointerEvents: "none",
            opacity: 0,
            background: "radial-gradient(circle, #fff 0 7%, #fff6cf 8% 12%, rgba(255,219,142,0.8) 15%, rgba(255,185,93,0.26) 31%, rgba(255,154,65,0.07) 52%, transparent 72%)",
            filter: "drop-shadow(0 0 12px rgba(255,218,145,0.75))",
            willChange: "transform, opacity, filter",
          }}
        />
      )}
      <Map
        key={projection}
        ref={mapRef}
        initialViewState={viewStateRef.current}
        minZoom={2.25}
        maxZoom={16}
        doubleClickZoom={false}
        maxBounds={cameraBounds}
        cursor="default"
        // DATA CREDIT, WHICH WAS SWITCHED OFF AND SHOULD NOT HAVE BEEN.
        //
        // Every border on this map comes from somebody, and two of those
        // somebodies require attribution as a condition of use: EuroGeographics
        // for the NUTS administrative boundaries (Germany's 38 Regierungsbezirke
        // came in that way) and the ONS Open Geography Portal under the Open
        // Government Licence (Britain's 46). GADM asks for citation too. The
        // control ships compact — a small (i) that expands — so it credits
        // without taking a corner of the board.
        attributionControl={{ compact: true, customAttribution: MAP_DATA_CREDIT }}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        dragPan
        fadeDuration={0}
        collectResourceTiming={false}
        crossSourceCollisions={false}
        renderWorldCopies={!hideParallelWorlds}
        // Cap MapLibre's per-source out-of-view tile-retention cache. Left unset it
        // sizes dynamically to ~(ceil(w/tileSize)+1)*(ceil(h/tileSize)+1)*5 tiles PER
        // source — ~270 at 1080p but ~800 at a 3840x2160 desktop viewport, and
        // renderWorldCopies feeds successive wrapped world-copy tiles into it as you
        // pan E/W, so retained GPU textures climb until the tab OOMs. 256 caps the 4K
        // case ~3x while barely trimming 1080p, and is a no-op on phone-sized viewports
        // (dynamic size there is well under 256). In-view tiles live in a separate
        // structure and are never evicted by this, so it never re-fetches what's on
        // screen. Orthogonal to applyDynamicPixelRatio (which bounds framebuffer pixels).
        maxTileCacheSize={256}
        projection={mapProjection}
        terrain={terrain}
        mapStyle={worldStyle}
        onIdle={handleIdle}
        onLoading={handleLoading}
        onMove={handleMove}
      >
        <Nations isGlobe={isGlobe} />
        <Cities />
        <MarkersLayer />
        <Units />
        <GlobeEffects active={isGlobe} />
        <RegionPopup />
        <CountryInfoPanel />
        <RegionInfoPanel />
        <UnitPopup />
        <FeaturePopup />
      </Map>
      {isGlobe && (
        <canvas
          id="oh-globe-lighting"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
      {loading && (
        <div style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5,
          background: "rgba(0,0,0,0.6)",
          color: "#aab",
          padding: "6px 14px",
          borderRadius: 20,
          fontSize: 13,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          backdropFilter: "blur(4px)",
        }}>
          Loading tiles…
        </div>
      )}
    </div>
  );
}

export default World;
