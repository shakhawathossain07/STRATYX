/**
 * Type helper utilities for safe type conversions
 * 
 * These helpers handle union types where values can be either
 * strings or objects with id/name properties, safely converting
 * them to strings for use in the UI and analytics.
 */

/**
 * Safely converts a value that may be a string, object with id/name, or undefined to a string.
 * Used for fields like player.character and game.map which can come as either format from the GRID API.
 * 
 * @param value - The value to convert (string | { id?: string; name?: string } | { name: string } | undefined)
 * @param fallback - Fallback string to use if value is undefined or cannot be resolved (default: '')
 * @returns A string representation of the value
 */
export function resolveToString(
  value: string | { id?: string; name?: string } | { name: string } | undefined,
  fallback: string = ''
): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    // Prefer name over id for display purposes
    return value.name ?? (value as { id?: string }).id ?? fallback;
  }
  return fallback;
}

/**
 * Safely converts a character/agent value to string.
 * Specific helper for player.character which can be { id: string; name: string } | string | undefined
 */
export function resolveCharacter(
  character: string | { id: string; name: string } | undefined
): string | undefined {
  if (typeof character === 'string') {
    return character;
  }
  if (character && typeof character === 'object') {
    return character.name ?? character.id;
  }
  return undefined;
}

/**
 * Safely converts a map value to string.
 * Specific helper for game.map which can be { name: string } | string | undefined
 */
export function resolveMapName(
  map: string | { name: string } | undefined
): string | undefined {
  if (typeof map === 'string') {
    return map;
  }
  if (map && typeof map === 'object') {
    return map.name;
  }
  return undefined;
}
