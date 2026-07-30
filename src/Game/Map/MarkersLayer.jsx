/*! Open Historia — built-structure map layer © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useMemo, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import { getNationColors } from "../../runtime/assets.js";
import { useWorldState } from "./useWorldState.js";

const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };

// Marker kinds are free-form ("military base", "missile silo", "embassy", …),
// so the on-map shape is picked by keyword: military-flavored structures get a
// triangle, everything else a square — the same glyph family the city layer
// draws with, so the font is guaranteed to have them.
const MILITARY_KIND = /\b(base|fort|fortress|bunker|silo|garrison|missile|radar|airfield|airbase|barracks|outpost|citadel|castle)\b/;

const glyphForKind = (kind) => (MILITARY_KIND.test(kind) ? "▲" : "■");

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
            glyph: glyphForKind(String(marker.kind || "")),
            rgb: ownerColorString(colorMap, marker.ownerCode),
          },
        })),
    };
  }, [markers, colorMap]);

  const sizeExpr = ["coalesce", ["get", "size"], 1];
  // Label importance boost: a size-3 monument reads ~1.6x, a 0.5 outpost ~0.85x.
  const labelBoost = ["+", 0.7, ["*", 0.3, sizeExpr]];

  return (
    <Source id="markers-source" type="geojson" data={data}>
      <Layer
        id="markers-shapes"
        type="symbol"
        layout={{
          // Big structures paint over small ones when they compete for space.
          "symbol-sort-key": ["-", sizeExpr],
          "text-field": ["get", "glyph"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-padding": 2,
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
        }}
      />
      <Layer
        id="markers-labels"
        type="symbol"
        minzoom={2.6}
        layout={{
          "symbol-sort-key": ["-", sizeExpr],
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
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
        }}
      />
    </Source>
  );
};

export default MarkersLayer;
