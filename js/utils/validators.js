/**
 * Normalização e validação de dados persistidos e entradas da aplicação.
 */
import { createId } from "../services/random.js";

export const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#84cc16", "#06b6d4", "#a855f7",
  "#fb923c", "#4ade80", "#60a5fa", "#e879f9"
];

export function isValidColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((it, i) => {
    const item = typeof it === "string" ? { label: it } : (it || {});
    const label = typeof item.label === "string" ? item.label.trim().slice(0, 40) : "";
    return {
      id: typeof item.id === "string" && item.id ? item.id : createId(),
      label,
      color: isValidColor(item.color) ? item.color : DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      eliminated: item.eliminated === true
    };
  }).filter((it) => it.label);
}

export function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry) => entry && typeof entry.label === "string")
    .map((entry) => ({
      id: typeof entry.id === "string" && entry.id ? entry.id : createId(),
      itemId: typeof entry.itemId === "string" ? entry.itemId : null,
      label: entry.label.slice(0, 100),
      time: Number.isFinite(Date.parse(entry.time)) ? new Date(entry.time).toISOString() : new Date().toISOString()
    }))
    .slice(-50);
}
