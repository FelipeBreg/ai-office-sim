/**
 * Lightweight JSON Schema validator for agent-to-agent payload validation.
 * Supports a subset of JSON Schema: type, required, properties, enum.
 * No external dependencies — runs in both browser and Node.
 */

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

type JsonSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  enum?: unknown[];
  items?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};

export function validatePayload(
  payload: unknown,
  schema: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];
  validateNode(payload, schema as JsonSchema, '', errors);
  return { valid: errors.length === 0, errors };
}

function validateNode(
  value: unknown,
  schema: JsonSchema,
  path: string,
  errors: ValidationError[],
): void {
  if (schema.type) {
    const actualType = getJsonType(value);
    if (schema.type === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push({ path: path || '$', message: `expected integer, got ${actualType}` });
        return;
      }
    } else if (schema.type !== actualType) {
      errors.push({ path: path || '$', message: `expected ${schema.type}, got ${actualType}` });
      return;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      path: path || '$',
      message: `value must be one of: ${schema.enum.map(String).join(', ')}`,
    });
  }

  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path: path || '$', message: `string too short (min ${schema.minLength})` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path: path || '$', message: `string too long (max ${schema.maxLength})` });
    }
  }

  if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path: path || '$', message: `value below minimum (${schema.minimum})` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path: path || '$', message: `value above maximum (${schema.maximum})` });
    }
  }

  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in obj)) {
          errors.push({ path: joinPath(path, key), message: 'required field missing' });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          validateNode(obj[key], propSchema, joinPath(path, key), errors);
        }
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      validateNode(value[i], schema.items, `${path}[${i}]`, errors);
    }
  }
}

function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

/**
 * Check if a cascade route is valid based on hierarchy rules.
 * - CEO (level 0) can trigger anyone
 * - Team leads can trigger within their team
 * - Members can trigger within team or one level up
 */
export function cascadeRouteValid(
  source: { hierarchyLevel: number; teamIds: string[] },
  target: { hierarchyLevel: number; teamIds: string[] },
): boolean {
  // CEO can trigger anyone
  if (source.hierarchyLevel === 0) return true;

  // Check if they share a team
  const sharedTeam = source.teamIds.some((t) => target.teamIds.includes(t));

  // Within same team: leads can trigger members, members can trigger leads
  if (sharedTeam) return true;

  // Cross-team: only one level up (escalation to a lead or CEO)
  if (target.hierarchyLevel < source.hierarchyLevel) {
    const levelDiff = source.hierarchyLevel - target.hierarchyLevel;
    return levelDiff <= 1;
  }

  // Cross-team same level or downward without shared team: blocked
  return false;
}
