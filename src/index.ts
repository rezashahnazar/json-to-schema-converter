/**
 * JSON to Schema Converter
 * A TypeScript library for converting JSON to JSON Schema
 */

/**
 * Options for the JSON Schema generation
 */
export interface JsonSchemaOptions {
  /**
   * Whether to detect and add format specifiers for common string patterns
   * @default true
   */
  detectFormat?: boolean;

  /**
   * The JSON Schema version to use
   * @default "07"
   */
  schemaVersion?: "07" | "2019-09" | "2020-12";

  /**
   * Maximum depth to process nested objects and arrays.
   * When depth is reached, nested structures will be simplified.
   * @default null (unlimited depth)
   */
  depth?: number | null;
}

/**
 * A JSON Schema object
 */
export interface JsonSchema {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Parse a JSON string and generate its schema
 * @param jsonString A valid JSON string
 * @param options Optional configuration options
 * @returns A JSON Schema object
 */
export function jsonToSchema(
  jsonString: string,
  options: JsonSchemaOptions = {}
): JsonSchema {
  try {
    const json = JSON.parse(jsonString);
    const schema = objectToSchema(json, options);

    // Determine which schema version to use
    let schemaUrl: string;
    switch (options.schemaVersion) {
      case "2019-09":
        schemaUrl = "https://json-schema.org/draft/2019-09/schema";
        break;
      case "2020-12":
        schemaUrl = "https://json-schema.org/draft/2020-12/schema";
        break;
      default:
        schemaUrl = "http://json-schema.org/draft-07/schema#";
        break;
    }

    // Add $schema property at the root level
    return {
      $schema: schemaUrl,
      ...schema,
    };
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
}

/**
 * Generates a JSON Schema from a JavaScript object/value.
 * @param value The JavaScript value (object, array, primitive, etc.)
 * @param options Configuration options
 * @param currentDepth Internal parameter to track current depth (used for recursion)
 * @returns A JSON Schema object
 */
export function objectToSchema(
  value: unknown,
  options: JsonSchemaOptions = {},
  currentDepth: number = 0
): JsonSchema {
  const maxDepth = options.depth ?? null;
  const depthReached = maxDepth !== null && currentDepth >= maxDepth;

  // Handle null
  if (value === null) {
    return { type: "null" };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return generateArraySchema(value, options, currentDepth, depthReached);
  }

  // Handle objects
  if (typeof value === "object") {
    return generateObjectSchema(
      value as Record<string, unknown>,
      options,
      currentDepth,
      depthReached
    );
  }

  // Handle primitive values (string, number, boolean, etc.)
  return generatePrimitiveSchema(value, options);
}

/**
 * Generates a JSON Schema for an array.
 * Detects item types and merges schemas for object items.
 * @param array The array to analyze
 * @param options Configuration options
 * @param currentDepth Current depth in the object tree
 * @param depthReached Whether the maximum depth has been reached
 * @returns A JSON Schema for the array
 */
function generateArraySchema(
  array: unknown[],
  options: JsonSchemaOptions,
  currentDepth: number,
  depthReached: boolean
): JsonSchema {
  if (depthReached) {
    return {
      type: "array",
    };
  }

  if (array.length === 0) {
    return {
      type: "array",
      items: {},
    };
  }

  const nextDepth = currentDepth + 1;
  const itemSchemas = array.map((item) =>
    objectToSchema(item, options, nextDepth)
  );

  const schemasByType: Record<string, JsonSchema[]> = {};
  for (const schema of itemSchemas) {
    const typeValue = schema.type;
    if (!schemasByType[typeValue]) {
      schemasByType[typeValue] = [];
    }
    schemasByType[typeValue].push(schema);
  }

  const distinctTypes = Object.keys(schemasByType);

  if (distinctTypes.length === 1) {
    const singleType = distinctTypes[0];
    if (singleType === "object") {
      const mergedSchema = mergeObjectSchemas(schemasByType[singleType]);
      return {
        type: "array",
        items: mergedSchema,
      };
    }
    return {
      type: "array",
      items: { type: singleType },
    };
  }

  const uniqueItemSchemas = deduplicateSchemas(itemSchemas);

  return {
    type: "array",
    items: {
      oneOf: uniqueItemSchemas,
    },
  };
}

/**
 * Generates a JSON Schema for an object.
 * @param obj The object to analyze
 * @param options Configuration options
 * @param currentDepth Current depth in the object tree
 * @param depthReached Whether the maximum depth has been reached
 * @returns A JSON Schema for the object
 */
function generateObjectSchema(
  obj: Record<string, unknown>,
  options: JsonSchemaOptions,
  currentDepth: number,
  depthReached: boolean
): JsonSchema {
  if (depthReached) {
    return {
      type: "object",
    };
  }

  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  const nextDepth = currentDepth + 1;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      properties[key] = objectToSchema(obj[key], options, nextDepth);
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

/**
 * Generates a JSON Schema for a primitive value (string, number, boolean, etc.).
 * @param value The primitive value
 * @param options Configuration options
 * @returns A JSON Schema for the primitive value
 */
function generatePrimitiveSchema(
  value: unknown,
  options: JsonSchemaOptions
): JsonSchema {
  const typeOfValue = typeof value;

  if (typeOfValue === "string") {
    return generateStringSchema(value as string, options);
  }

  if (typeOfValue === "number") {
    return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
  }

  // For boolean or other possible types
  return { type: typeOfValue };
}

/**
 * Generates a JSON Schema specifically for a string.
 * Optionally detects formats like date-time, email, uri, uuid.
 * @param str The string value
 * @param options Configuration options
 * @returns A JSON Schema for the string (with optional format)
 */
function generateStringSchema(
  str: string,
  options: JsonSchemaOptions
): JsonSchema {
  if (options.detectFormat === false) {
    return { type: "string" };
  }

  // Check date-time format (ISO 8601)
  if (
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
      str
    )
  ) {
    return { type: "string", format: "date-time" };
  }

  // Check email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return { type: "string", format: "email" };
  }

  // Check URI
  if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(str)) {
    return { type: "string", format: "uri" };
  }

  // Check UUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      str
    )
  ) {
    return { type: "string", format: "uuid" };
  }

  // Default string schema
  return { type: "string" };
}

/**
 * Merge multiple object schemas into one.
 * Properties that appear in all schemas become required.
 * Properties that appear in some schemas but have different types
 * use oneOf to combine them.
 * @param schemas Array of object schemas to merge
 * @returns The merged schema
 */
export function mergeObjectSchemas(schemas: JsonSchema[]): JsonSchema {
  const allProperties = new Set<string>();

  // Collect all property names from all schemas
  for (const schema of schemas) {
    if (schema.properties) {
      for (const prop of Object.keys(schema.properties)) {
        allProperties.add(prop);
      }
    }
  }

  const mergedProperties: Record<string, JsonSchema> = {};
  const requiredProperties = new Set<string>();
  const totalSchemas = schemas.length;

  // For each property, unify the schemas that mention it
  for (const prop of allProperties) {
    let schemasWithPropCount = 0;
    const propSchemas: JsonSchema[] = [];

    for (const schema of schemas) {
      if (schema.properties && schema.properties[prop]) {
        schemasWithPropCount++;
        propSchemas.push(schema.properties[prop]);

        // Check if this property is required in the schema
        if (Array.isArray(schema.required) && schema.required.includes(prop)) {
          requiredProperties.add(prop);
        }
      }
    }

    // If we have at least one schema containing this property, unify them
    if (schemasWithPropCount > 0) {
      // Check if all schemas for this property have the same type
      const firstType = JSON.stringify(propSchemas[0]);
      const allSameType = propSchemas.every(
        (propSchema) => JSON.stringify(propSchema) === firstType
      );

      if (allSameType) {
        // If all schemas are identical, just use the first
        mergedProperties[prop] = propSchemas[0];
      } else {
        // If there's variation, create a oneOf with unique schemas
        mergedProperties[prop] = { oneOf: deduplicateSchemas(propSchemas) };
      }

      // If the property does not exist in all schemas, it cannot be required
      if (schemasWithPropCount < totalSchemas) {
        requiredProperties.delete(prop);
      }
    }
  }

  return {
    type: "object",
    properties: mergedProperties,
    required:
      requiredProperties.size > 0 ? Array.from(requiredProperties) : undefined,
  };
}

/**
 * Deduplicate an array of schemas by their JSON string representation.
 * @param schemas An array of JSON Schemas
 * @returns The array of unique JSON Schemas
 */
export function deduplicateSchemas(schemas: JsonSchema[]): JsonSchema[] {
  const map = new Map<string, JsonSchema>();
  for (const schema of schemas) {
    const key = JSON.stringify(schema);
    map.set(key, schema);
  }
  return Array.from(map.values());
}
