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
    const schema = generateJsonSchema(json, options);

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
 * Generates a JSON Schema from a JSON value.
 * @param value The JSON value (object, array, primitive, etc.)
 * @param options Configuration options
 * @returns A JSON Schema object
 */
export function generateJsonSchema(
  value: unknown,
  options: JsonSchemaOptions = {}
): JsonSchema {
  // Handle null
  if (value === null) {
    return { type: "null" };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return generateArraySchema(value, options);
  }

  // Handle objects
  if (typeof value === "object") {
    return generateObjectSchema(value as Record<string, unknown>, options);
  }

  // Handle primitive values (string, number, boolean, etc.)
  return generatePrimitiveSchema(value, options);
}

/**
 * Generates a JSON Schema for an array.
 * Detects item types and merges schemas for object items.
 * @param array The array to analyze
 * @param options Configuration options
 * @returns A JSON Schema for the array
 */
function generateArraySchema(
  array: unknown[],
  options: JsonSchemaOptions
): JsonSchema {
  if (array.length === 0) {
    // Empty array
    return {
      type: "array",
      items: {},
    };
  }

  // Generate schema for each item in the array
  const itemSchemas = array.map((item) => generateJsonSchema(item, options));

  // Group schemas by their "type" property
  const schemasByType: Record<string, JsonSchema[]> = {};
  for (const schema of itemSchemas) {
    const typeValue = schema.type;
    if (!schemasByType[typeValue]) {
      schemasByType[typeValue] = [];
    }
    schemasByType[typeValue].push(schema);
  }

  const distinctTypes = Object.keys(schemasByType);

  // If there is only one type, we simplify (removed the "mixed" check)
  if (distinctTypes.length === 1) {
    const singleType = distinctTypes[0];
    // If it's an array of objects, attempt to merge the object schemas
    if (singleType === "object") {
      const mergedSchema = mergeObjectSchemas(schemasByType[singleType]);
      return {
        type: "array",
        items: mergedSchema,
      };
    }
    // Otherwise, it's an array of a single primitive type
    return {
      type: "array",
      items: { type: singleType },
    };
  }

  // For mixed-type arrays, use oneOf with unique item schemas
  const uniqueItemSchemas = deduplicateSchemas(itemSchemas);

  // Create array schema with oneOf for item schemas
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
 * @returns A JSON Schema for the object
 */
function generateObjectSchema(
  obj: Record<string, unknown>,
  options: JsonSchemaOptions
): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      properties[key] = generateJsonSchema(obj[key], options);
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
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+\-]\d{2}:\d{2})?)?$/.test(
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
