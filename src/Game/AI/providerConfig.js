/*! Open Historia — portions (reasoning-effort toggle persistence) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
export const DEFAULT_PROVIDER = "gemini";

export const PROVIDER_OPTIONS = [
    {
        value: "gemini",
        label: "Gemini",
        group: "Native APIs",
        description: "Google AI Studio / Gemini API",
        searchTerms: ["google", "ai studio", "generativelanguage"],
    },
    {
        value: "openai",
        label: "OpenAI",
        group: "Native APIs",
        description: "Official OpenAI API",
        searchTerms: ["gpt", "o3", "o4", "responses", "chatgpt"],
    },
    {
        value: "anthropic",
        label: "Anthropic",
        group: "Native APIs",
        description: "Claude via Messages API",
        searchTerms: ["claude", "haiku", "sonnet", "opus"],
    },
    {
        value: "openai-compatible",
        label: "OpenAI Compatible",
        group: "Gateways and self-hosted",
        description: "Ollama, LM Studio, OpenRouter, local gateways",
        searchTerms: ["ollama", "lm studio", "openrouter", "vllm", "gateway", "proxy"],
    },
    {
        value: "anthropic-compatible",
        label: "Anthropic Compatible",
        group: "Gateways and self-hosted",
        description: "Self-hosted proxy that speaks the Anthropic Messages API",
        searchTerms: ["claude", "anthropic", "messages api", "proxy", "gateway", "self-hosted"],
    },
];

const PROVIDER_SETTINGS = {
    gemini: {
        apiKey: { storageKey: "gemini_api_key", defaultValue: "" },
        model: { storageKey: "gemini_model", defaultValue: "gemini-3.5-flash-lite" },
        customParams: { storageKey: "gemini_custom_params", defaultValue: "" },
    },
    openai: {
        apiKey: { storageKey: "openai_api_key", defaultValue: "" },
        model: { storageKey: "openai_model", defaultValue: "" },
        customParams: { storageKey: "openai_custom_params", defaultValue: "" },
    },
    anthropic: {
        apiKey: { storageKey: "anthropic_api_key", defaultValue: "" },
        model: { storageKey: "anthropic_model", defaultValue: "claude-haiku-4-5" },
        customParams: { storageKey: "anthropic_custom_params", defaultValue: "" },
    },
    // Self-hosted proxy speaking the Anthropic Messages API — called directly
    // from the browser first, falling back to the local relay only when the page
    // is served locally (see main.jsx providerFetch/callAnthropicCompatible). On
    // a hosted website the proxy must send its own CORS headers. Separate from
    // the native Anthropic API above.
    "anthropic-compatible": {
        apiKey: { storageKey: "anthropic_compatible_api_key", defaultValue: "" },
        endpoint: { storageKey: "anthropic_compatible_endpoint", defaultValue: "" },
        model: { storageKey: "anthropic_compatible_model", defaultValue: "claude-haiku-4-5" },
        customParams: { storageKey: "anthropic_compatible_custom_params", defaultValue: "" },
    },
    "openai-compatible": {
        apiKey: { storageKey: "openai_compatible_api_key", defaultValue: "" },
        endpoint: {
            storageKey: "openai_compatible_endpoint",
            legacyKeys: ["custom_api_endpoint"],
            defaultValue: "http://localhost:11434/v1",
        },
        model: {
            storageKey: "openai_compatible_model",
            legacyKeys: ["custom_api_model"],
            defaultValue: "",
        },
        customParams: { storageKey: "openai_compatible_custom_params", defaultValue: "" },
    },
};

const FORM_FIELD_MAP = {
    geminiApiKey: { provider: "gemini", field: "apiKey" },
    geminiModel: { provider: "gemini", field: "model" },
    geminiCustomParams: { provider: "gemini", field: "customParams" },
    openaiApiKey: { provider: "openai", field: "apiKey" },
    openaiModel: { provider: "openai", field: "model" },
    openaiCustomParams: { provider: "openai", field: "customParams" },
    anthropicApiKey: { provider: "anthropic", field: "apiKey" },
    anthropicModel: { provider: "anthropic", field: "model" },
    anthropicCustomParams: { provider: "anthropic", field: "customParams" },
    anthropicCompatibleApiKey: { provider: "anthropic-compatible", field: "apiKey" },
    anthropicCompatibleEndpoint: { provider: "anthropic-compatible", field: "endpoint" },
    anthropicCompatibleModel: { provider: "anthropic-compatible", field: "model" },
    anthropicCompatibleCustomParams: { provider: "anthropic-compatible", field: "customParams" },
    openaiCompatibleApiKey: { provider: "openai-compatible", field: "apiKey" },
    openaiCompatibleEndpoint: { provider: "openai-compatible", field: "endpoint" },
    openaiCompatibleModel: { provider: "openai-compatible", field: "model" },
    openaiCompatibleCustomParams: { provider: "openai-compatible", field: "customParams" },
};

function isSupportedProvider(value) {
    return PROVIDER_OPTIONS.some((provider) => provider.value === value);
}

function readStoredValue(setting) {
    if (!setting?.storageKey) return setting?.defaultValue ?? "";

    const primaryValue = localStorage.getItem(setting.storageKey);
    if (primaryValue !== null) return primaryValue;

    for (const legacyKey of setting.legacyKeys ?? []) {
        const legacyValue = localStorage.getItem(legacyKey);
        if (legacyValue !== null) return legacyValue;
    }

    return setting.defaultValue ?? "";
}

function getSettingConfig(provider, field) {
    return PROVIDER_SETTINGS[normalizeProvider(provider)]?.[field] ?? null;
}

export function normalizeProvider(provider) {
    if (provider === "custom") return "openai-compatible";
    return isSupportedProvider(provider) ? provider : DEFAULT_PROVIDER;
}

export function getStoredProvider() {
    return normalizeProvider(localStorage.getItem("api_provider"));
}

export function getProviderMeta(provider) {
    return PROVIDER_OPTIONS.find((option) => option.value === normalizeProvider(provider))
        ?? PROVIDER_OPTIONS[0];
}

export function providerSupportsModelDiscovery(provider) {
    const normalized = normalizeProvider(provider);
    return normalized === "openai" || normalized === "openai-compatible";
}

export function getProviderField(provider, field) {
    const setting = getSettingConfig(provider, field);
    return setting ? readStoredValue(setting) : "";
}

export function setProviderField(provider, field, value) {
    const setting = getSettingConfig(provider, field);
    if (!setting?.storageKey) return;
    localStorage.setItem(setting.storageKey, value ?? "");
}

export function getProviderSettings(provider) {
    const normalized = normalizeProvider(provider);
    return {
        provider: normalized,
        apiKey: getProviderField(normalized, "apiKey"),
        endpoint: getProviderField(normalized, "endpoint"),
        model: getProviderField(normalized, "model"),
        customParams: getProviderField(normalized, "customParams"),
    };
}

// Global "model reasoning" toggle — applied by callAI in every provider mode
// (Gemini thinkingConfig, OpenAI/compatible reasoning_effort, Anthropic thinking).
const REASONING_STORAGE_KEY = "ai_reasoning_enabled";

// Reasoning is ON by default: only an explicit "0" (the user turned it off) disables
// it, so a fresh install or cleared storage gets model reasoning without opting in.
export function getReasoningEnabled() {
    return localStorage.getItem(REASONING_STORAGE_KEY) !== "0";
}

export function setReasoningEnabled(enabled) {
    localStorage.setItem(REASONING_STORAGE_KEY, enabled ? "1" : "0");
}

// ---- Role-based model routing ----
// Every AI call carries a role (event / advisor / chat / translate). A role can
// inherit the globally selected provider or pin a different one, override the
// model name, and force reasoning ("thinking") on or off — so heavy turn
// simulation and lightweight translation no longer have to share one model.
// Field report (and the upstream Pax Historia team's own advice, 2026-06):
// thinking is a main source of local-model instability, so per-role reasoning
// control is a first-class switch here, not a global-only toggle.
export const AI_ROLES = [
    { key: "event", label: "Events & turns", blurb: "Timeline jumps, event generation, action brainstorming" },
    { key: "advisor", label: "Advisor", blurb: "Advisor chat, intel briefings, backstory" },
    { key: "chat", label: "Diplomacy", blurb: "Diplomatic chats with other nations" },
    { key: "translate", label: "Translation", blurb: "UI translation batches" },
];

const ROLE_CONFIG_KEY = "ai_role_config";

export function getRoleConfigs() {
    let parsed = {};
    try {
        parsed = JSON.parse(localStorage.getItem(ROLE_CONFIG_KEY)) ?? {};
    } catch {
        parsed = {};
    }

    const configs = {};
    for (const role of AI_ROLES) {
        const entry = parsed[role.key] && typeof parsed[role.key] === "object" ? parsed[role.key] : {};
        configs[role.key] = {
            provider: entry.provider === "inherit" || isSupportedProvider(entry.provider) ? entry.provider : "inherit",
            model: typeof entry.model === "string" ? entry.model : "",
            reasoning: ["inherit", "on", "off"].includes(entry.reasoning) ? entry.reasoning : "inherit",
        };
    }
    return configs;
}

export function setRoleConfig(roleKey, partial) {
    const configs = getRoleConfigs();
    if (!configs[roleKey]) return;
    configs[roleKey] = { ...configs[roleKey], ...partial };
    try {
        localStorage.setItem(ROLE_CONFIG_KEY, JSON.stringify(configs));
    } catch {
        // Private-mode storage failures leave role routing on defaults.
    }
}

// Per-call resolution: everything a provider call needs, captured SYNCHRONOUSLY
// at callAI entry so overlapping calls with different roles cannot race each
// other's settings reads (translation batches run concurrently with jumps).
export function resolveRoleSettings(role) {
    const cfg = getRoleConfigs()[role] ?? { provider: "inherit", model: "", reasoning: "inherit" };
    const provider = cfg.provider !== "inherit" ? normalizeProvider(cfg.provider) : getStoredProvider();
    const settings = getProviderSettings(provider);
    if (cfg.model.trim()) {
        settings.model = cfg.model.trim();
    }
    const reasoning = cfg.reasoning === "on" ? true : cfg.reasoning === "off" ? false : getReasoningEnabled();
    return { ...settings, provider, reasoning };
}

export function loadProviderSettingsFormState() {
    const state = {};

    for (const [stateKey, mapping] of Object.entries(FORM_FIELD_MAP)) {
        state[stateKey] = getProviderField(mapping.provider, mapping.field);
    }

    return state;
}

export function persistProviderSetting(stateKey, value) {
    const mapping = FORM_FIELD_MAP[stateKey];
    if (!mapping) return;
    setProviderField(mapping.provider, mapping.field, value);
}
