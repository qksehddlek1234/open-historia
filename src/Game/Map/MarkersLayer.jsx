/*! Open Historia — built-structure map layer © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useMemo, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import { getNationColors } from "../../runtime/assets.js";
import { useWorldState } from "./useWorldState.js";
import { glyphForFeatureKind } from "../../runtime/featureKinds.js";
import { isUnderConstruction } from "../../runtime/construction.js";
import { MAP_SETTING_KEYS, useDisplayScale, useFeatureLabelStack, useMapSetting } from "../../runtime/mapSettings.js";

const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };

// The on-map shape comes from the shared catalogue (runtime/featureKinds.js) —
// military structures get a triangle, everything else a square, the same glyph
// family the city layer draws with so the font is guaranteed to have them. It
// used to be a local regex here, which is why a "medical center" and an
// "airfield" disagreed with the popup about what they were.

const ownerColorString = (colorMap, code) => {
  const rgb = colorMap[String(code ?? "").trim()];
  if (Array.isArray(rgb)) return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  // Unowned / unknown-owner structures read as neutral parchment, not an error.
  return "rgb(226, 222, 205)";
};

// World.markers — structures founded during play (cities, military bases,
// bunkers, missile silos, embassies…). Rendered in the visual language of the
// city layer (glyph + haloed label) but colored by owner so a forward base
// reads as belonging to someone.
const MarkersLayer = () => {
    const fontStack = useFeatureLabelStack();
  const { markers } = useWorldState();
  const [colorMap, setColorMap] = useState({});

  useEffect(() => {
    getNationColors()
      .then(setColorMap)
      .catch((error) => console.error("Failed to load colors for markers:", error));
  }, []);

  const data = useMemo(() => {
    if (!markers.length) return EMPTY_FEATURE_COLLECTION;
    return {
      type: "FeatureCollection",
      features: markers
        .filter((marker) => Number.isFinite(marker.lng) && Number.isFinite(marker.lat) && marker.name)
        .map((marker) => ({
          type: "Feature",
          id: marker.id,
          geometry: { type: "Point", coordinates: [marker.lng, marker.lat] },
          properties: {
            id: marker.id,
            name: marker.name,
            kind: marker.kind || "landmark",
            ownerCode: marker.ownerCode || "",
            // Importance drives differentiated sizing: a monumental structure
            // (size 3) reads big; a minor outpost (0.5) stays small — like the
            // original's per-feature size attribute.
            size: Number.isFinite(marker.size) && marker.size > 0 ? Math.max(0.5, Math.min(3, marker.size)) : 1,
            glyph: glyphForFeatureKind(marker.kind),
            // The player's own paint wins over the owner's. Set from the feature
            // editor's colour override and nowhere else, so a feature keeps
            // taking its owner's colour — following conquests and recolourings —
            // until somebody deliberately pins it to one.
            rgb: marker.color || ownerColorString(colorMap, marker.ownerCode),
            // A SITE UNDER CONSTRUCTION IS NOT A SITE YET (runtime/construction.js).
            // It draws faint and says when it opens, so the map reads as a
            // pipeline rather than as a list of things that already exist —
            // which is what it had become at 143 structures in 30 rounds.
            building: isUnderConstruction(marker) ? 1 : 0,
            label: isUnderConstruction(marker)
              ? `${marker.name} (${marker.readyAt || "건설 중"})`
              : marker.name,
          },
        })),
    };
  }, [markers, colorMap]);

  // HOW BIG A FEATURE DRAWS, and whether its own size attribute counts.
  //
  // RELATIVE (the default) honours the per-feature size the AI and the editor
  // set, so a monumental works reads bigger than an outpost. ABSOLUTE ignores it
  // and draws every feature the same, which is what you want when the map is a
  // working document rather than a picture — fifty structures around one
  // peninsula at five different sizes is harder to scan, not easier.
  const featureScale = useDisplayScale("featureSize");
  const absoluteSize = useMapSetting(MAP_SETTING_KEYS.featureSizeAbsolute);
  const sizeExpr = absoluteSize
    ? featureScale
    : ["*", ["coalesce", ["get", "size"], 1], featureScale];
  // Half-drawn, so an unfinished site reads as unfinished at a glance.
  const buildingOpacity = ["case", ["==", ["get", "building"], 1], 0.45, 1];
  // Label importance boost: a size-3 monument reads ~1.6x, a 0.5 outpost ~0.85x.
  const labelBoost = ["+", 0.7, ["*", 0.3, sizeExpr]];

  return (
    <>
      <Source id="markers-source" type="geojson" data={data}>
        <Layer
          id="markers-shapes"
          type="symbol"
          layout={{
            // Big structures win the space when they compete for it.
            "symbol-sort-key": ["-", sizeExpr],
            "text-field": ["get", "glyph"],
            // These used to draw unconditionally, and it is the structures — not the
            // cities — that a player actually sees pile up, because every one of them
            // is something THEY built and they are all in the same country. Fifty of
            // them around one peninsula is an unreadable knot at any zoom below
            // regional, and the ~10km spacing the placement pass gives them is
            // sub-pixel when the continent is on screen.
            //
            // Thinned like the cities now, biggest first, so the map shows the major
            // works from far away and reveals the rest as you come in. Still every one
            // of them is CLICKABLE the moment it draws, and the click handler resolves
            // to the nearest, so nothing became unreachable.
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "text-padding": 4,
            // Icon scales with BOTH zoom and the structure's own size. The
            // per-feature factor multiplies each STOP, never the interpolate
            // itself: MapLibre accepts ["zoom"] only as the direct input of a
            // TOP-LEVEL step/interpolate, so wrapping the interpolate in ["*"]
            // made the whole property invalid ("zoom expression may only be used
            // as input to a top-level step or interpolate expression", logged on
            // every style update) and the layer silently fell back to the default
            // text size — marker sizes stopped mattering at all.
            "text-size": [
              "interpolate", ["linear"], ["zoom"],
              2, ["*", 9, sizeExpr],
              6, ["*", 14, sizeExpr],
              10, ["*", 20, sizeExpr],
            ],
          }}
          paint={{
            "text-color": ["get", "rgb"],
            "text-halo-color": "#ffffff",
            "text-halo-width": 1,
            "text-opacity": buildingOpacity,
          }}
        />
      </Source>
      {/* Second source id, same `data` object — see the note in Cities.jsx. The map
          runs with crossSourceCollisions={false}, so one source per layer gives the
          glyphs and the names separate collision groups. On a single source a
          structure's own name (0.7em off the point, 5px padding) landed on its own
          glyph's box and one of the two was always deleted: with the glyph placed
          second, the whole map turned into floating captions over nothing. Split,
          each thins against its own kind and a structure always draws its point. */}
      <Source id="markers-label-source" type="geojson" data={data}>
        <Layer
          id="markers-labels"
          type="symbol"
          minzoom={2.6}
          layout={{
            "symbol-sort-key": ["-", sizeExpr],
            // Carries the completion date while a site is being built, so the
            // player can read the pipeline off the map without clicking.
            "text-field": ["get", "label"],
            "text-font": fontStack,
            "text-padding": 5,
            "text-radial-offset": 0.7,
            // Labels scale with zoom, gently boosted by importance — same
            // top-level-interpolate rule as the shapes layer above.
            "text-size": [
              "interpolate", ["linear"], ["zoom"],
              3, ["*", 8.5, labelBoost],
              10, ["*", 10, labelBoost],
            ],
            "text-variable-anchor": ["top", "bottom", "left", "right"],
          }}
          paint={{
            "text-color": "#ffffff",
            "text-halo-color": "#333333",
            "text-halo-width": 2,
            "text-opacity": buildingOpacity,
          }}
        />
      </Source>
    </>
  );
};

export default MarkersLayer;
