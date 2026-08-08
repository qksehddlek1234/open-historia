/*! Open Historia — portions (per-scenario era city layer) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import {
    PMTILES_PROTOCOL_URLS,
    JSON_URLS,
    ensurePmtilesProtocol,
    readJson,
} from "../../runtime/assets.js";
import { useWorldState } from "./useWorldState.js";
import { hidePromotedCitiesFilter } from "../../runtime/cityFeatures.js";

ensurePmtilesProtocol();

const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };

// WHY THE GLYPHS AND THE NAMES SIT ON SEPARATE SOURCES
//
// Both layers need collision thinning, and each needs it against ITS OWN KIND:
// glyphs crowd glyphs, names crowd names. On one source they instead fight each
// other, and a city loses to itself — its name is placed at a 0.7em radial offset
// with 5px of padding, which lands squarely on top of its own glyph's box, so
// whichever of the two is placed first deletes the other. MapLibre places the
// style back-to-front (PauseablePlacement: _currentPlacementIndex = order.length
// - 1, decrementing), so that was decided by nothing more meaningful than which
// <Layer> was typed first — and it cost every ★ ◆ ■ on the map, capitals included,
// while the names stayed. Reversing the order only swaps which half disappears:
// place the glyph first and every large capital loses its name instead, because a
// 20px star with padding covers the whole ring the label has to fit in.
//
// The map has crossSourceCollisions={false} (World.jsx), and MapLibre gives each
// source id its own collision group under that flag (CollisionGroups.get). So one
// source per layer means the two are thinned independently and never contend:
// glyphs stay dense-but-readable, names stay dense-but-readable, and a city always
// draws its point even where its name had to be dropped. The extra source is the
// same archive/data — no second copy of anything, just a second collision group.

// Which cities are even CANDIDATES at this zoom. The thinning that actually keeps
// the map readable is collision-based (see cities-shapes below) — this only stops
// the renderer considering a town when the player is looking at a continent.
//
// Raised across the board because population alone ranks cities badly for this
// purpose: China has over a hundred cities above a million and dozens above
// 2.5M, so the old base threshold put a hundred labels on one country while
// most of Africa and South America showed a handful. National capitals are
// exempt at every zoom — a capital is important because of what it IS, not how
// many people live there.
const populationFilter = [
    "any",
    ["==", ["get", "capital"], "primary"],
    ["==", ["get", "capital"], true],
    [
        ">",
        ["get", "population"],
        [
            "step", ["zoom"],
            3000000,
            5, 1500000,
            6, 800000,
            7, 400000,
            8, 200000,
            9.5, 100000,
        ],
    ],
];

// Custom (scenario-authored) cities are a curated era set, not the 70k-strong
// modern database, and their historical populations are far below modern
// thresholds (Paris in 1200 held ~50k). Visibility is driven by the authored
// prominence tier instead: 4 = capital, 3 = major city, 2 = city, 1 = town.
const customTierFilter = [
    "any",
    [">=", ["get", "tier"], 3],
    ["all", [">=", ["get", "tier"], 2], [">=", ["zoom"], 4.3]],
    [">=", ["zoom"], 5.8],
];

// Capitals first, exactly as the stock layer does it, so an authored capital is
// never the symbol that loses its patch to a larger neighbour.
const customSortKey = [
    "case",
    ["==", ["get", "capital"], "primary"], -1000000000000,
    ["-", ["+", ["*", ["coalesce", ["get", "tier"], 1], 1000000000], ["coalesce", ["get", "population"], 0]]],
];

// Stock/custom city labels come from the immutable PMTiles/geojson "city" property.
// AI renames (world.cityRenames) are applied as a client-side match override so a
// renamed city shows its new name without touching the tiles.
const cityLabelExpr = (renames) => {
    const pairs = Object.entries(renames || {});
    if (!pairs.length) return ["get", "city"];
    const expr = ["match", ["downcase", ["get", "city"]]];
    for (const [from, to] of pairs) expr.push(from, to);
    expr.push(["get", "city"]);
    return expr;
};

// Capitals are placed FIRST, ahead of any city however large, then everyone else by
// population. Placement order decides who survives a collision, so without this a
// capital could be squeezed out by a bigger neighbour — and a capital is on the map
// for what it IS. Shared by both layers so a city's glyph and its name are ranked
// identically and the two views of the map stay consistent.
const stockSortKey = [
    "case",
    ["==", ["get", "capital"], "primary"], -1000000000,
    ["-", ["coalesce", ["get", "population"], 0]],
];

const stockShapeLayout = {
    "symbol-sort-key": stockSortKey,
    // Collision thinning, at every zoom, and it has to be every zoom: the mat is
    // WORST at world zoom, where the whole of eastern China is a few hundred
    // pixels across.
    //
    // Measured on the shipped city set: China holds 244 of the world's 389 cities
    // over three million — 63% of them — because the population figures are
    // prefecture-level, and a Chinese prefecture is an administrative region
    // containing rural counties, not a built-up area. Qinhuangdao enters the list
    // at 3.1M. No global population threshold can fix that: raising it until China
    // is clean empties South America and Africa, which is the failure the first
    // attempt at this actually shipped.
    //
    // Density is a screen-space problem, so it gets a screen-space answer. Whoever
    // is placed first wins their patch, and symbol-sort-key above puts every capital
    // ahead of every city, so a capital is never the one that loses — which was the
    // OTHER half of the earlier breakage: with cities sorted purely by population,
    // 244 Chinese prefectures outranked most of the world's capitals and took their
    // place on the map.
    "text-allow-overlap": false,
    "text-field": [
        "case",
        ["==", ["get", "capital"], "primary"], "★",
        [">=", ["get", "population"], 2500000], "◆",
        "■",
    ],
    // Enough to keep neighbours visibly apart without a marker claiming a patch
    // far larger than it draws.
    "text-padding": 3,
    "text-size": [
        "interpolate", ["linear"], ["zoom"],
        3, [
            "*",
            [
                "interpolate", ["linear"], ["get", "population"],
                100000, 6,
                1000000, 10,
            ],
            [
                "case",
                ["==", ["get", "capital"], "primary"], 2.5,
                [">=", ["get", "population"], 2500000], 2,
                1,
            ],
        ],
        10, 22,
    ],
};

const shapePaint = {
    "text-color": "rgba(0,0,0,0)",
    "text-halo-color": "#ffffff",
    "text-halo-width": 0.5,
};

const labelPaint = {
    "text-color": "#ffffff",
    "text-halo-color": "#333333",
    "text-halo-width": 2,
};

const StockCities = ({ label, filter }) => (
    <>
        <Source id="cities-source" type="vector" url={PMTILES_PROTOCOL_URLS.cities}>
            <Layer
                id="cities-shapes"
                type="symbol"
                source-layer="cities"
                minzoom={3.4}
                filter={filter}
                layout={stockShapeLayout}
                paint={shapePaint}
            />
        </Source>
        {/* Same archive, second source id — a second collision group, so the names
            below thin against each other and never against the points above. */}
        <Source id="cities-label-source" type="vector" url={PMTILES_PROTOCOL_URLS.cities}>
            <Layer
                id="cities-labels"
                type="symbol"
                source-layer="cities"
                minzoom={3.4}
                filter={filter}
                layout={{
                    "symbol-sort-key": stockSortKey,
                    "text-field": label,
                    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                    "text-padding": 5,
                    "text-radial-offset": 0.7,
                    "text-size": [
                        "interpolate", ["linear"], ["zoom"],
                        3, 8,
                        10, 10,
                    ],
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                }}
                paint={labelPaint}
            />
        </Source>
    </>
);

// Same visual language as the stock layers (★/◆/■ markers, haloed labels), but
// fed from the scenario's cities.geojson and gated by the authored tier. Split
// across two sources for the same reason as the stock layer — same `data` object,
// so the second source costs a collision group and nothing else.
const CustomCities = ({ data, label, filter }) => (
    <>
        <Source id="cities-source" type="geojson" data={data}>
            <Layer
                id="cities-shapes"
                type="symbol"
                minzoom={3.4}
                filter={filter}
                layout={{
                    "symbol-sort-key": customSortKey,
                    // Same collision thinning as the stock layer, ranked by authored tier.
                    "text-allow-overlap": false,
                    "text-field": [
                        "case",
                        ["==", ["get", "capital"], "primary"], "★",
                        [">=", ["get", "tier"], 3], "◆",
                        "■",
                    ],
                    "text-padding": 3,
                    "text-size": [
                        "interpolate", ["linear"], ["zoom"],
                        3, ["match", ["get", "tier"], 4, 15, 3, 12, 2, 8, 6],
                        10, 22,
                    ],
                }}
                paint={shapePaint}
            />
        </Source>
        <Source id="cities-label-source" type="geojson" data={data}>
            <Layer
                id="cities-labels"
                type="symbol"
                minzoom={3.4}
                filter={filter}
                layout={{
                    "symbol-sort-key": customSortKey,
                    "text-field": label,
                    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                    "text-padding": 5,
                    "text-radial-offset": 0.7,
                    "text-size": [
                        "interpolate", ["linear"], ["zoom"],
                        3, ["match", ["get", "tier"], 4, 9.5, 3, 9, 8],
                        10, 10,
                    ],
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                }}
                paint={labelPaint}
            />
        </Source>
    </>
);

const Cities = () => {
    // world.customCities marks scenarios whose maps carry their own era-accurate
    // city set (presets, editor maps). Consumed from the shared world-state hook
    // so the map doesn't fire its own independent 5s poll.
    const { customCities: customFlag, cityRenames, markers } = useWorldState();
    const [customData, setCustomData] = useState(null);
    const citiesGeojsonUrl = JSON_URLS.citiesGeojson;
    const label = React.useMemo(() => cityLabelExpr(cityRenames), [cityRenames]);

    // A CITY SOMEONE EDITED IS DRAWN BY THE FEATURE LAYER NOW.
    //
    // Editing a stock city promotes it into world.markers as a kind:"city"
    // feature (runtime/cityFeatures.js). The archive still holds the original, so
    // without this it would draw twice — once from the tiles and once as a
    // feature, in two different styles, at the same coordinate.
    const stockFilter = React.useMemo(() => {
        const hide = hidePromotedCitiesFilter(markers, cityRenames);
        return hide ? ["all", populationFilter, hide] : populationFilter;
    }, [markers, cityRenames]);
    const customFilter = React.useMemo(() => {
        const hide = hidePromotedCitiesFilter(markers, cityRenames);
        return hide ? ["all", customTierFilter, hide] : customTierFilter;
    }, [markers, cityRenames]);

    // The city set itself is static per scenario — fetched once when the flag (or
    // the runtime token behind the URL) changes.
    useEffect(() => {
        let cancelled = false;
        if (!customFlag) {
            setCustomData(null);
            return undefined;
        }
        readJson(citiesGeojsonUrl, { defaultValue: EMPTY_FEATURE_COLLECTION, force: true })
            .then((data) => {
                if (cancelled) return;
                setCustomData(data && Array.isArray(data.features) ? data : EMPTY_FEATURE_COLLECTION);
            })
            .catch(() => {
                if (!cancelled) setCustomData(EMPTY_FEATURE_COLLECTION);
            });
        return () => {
            cancelled = true;
        };
    }, [customFlag, citiesGeojsonUrl]);

    // Custom-city scenarios never show the modern database (anachronistic); while
    // the custom set is still loading, show nothing rather than flash modern names.
    if (customFlag) {
        if (!customData || !customData.features.length) return null;
        return <CustomCities data={customData} label={label} filter={customFilter} />;
    }
    return <StockCities label={label} filter={stockFilter} />;
};

export default Cities;
