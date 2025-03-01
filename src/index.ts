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
 * Generates a JSON Schema from a JSON object
 * @param json The JSON object to analyze
 * @param options Optional configuration options
 * @returns A JSON Schema object representing the structure of the input
 */
function generateJsonSchema(
  json: any,
  options: { detectFormat?: boolean } = {}
): any {
  // Handle null values
  if (json === null) {
    return { type: "null" };
  }

  // Handle arrays
  if (Array.isArray(json)) {
    if (json.length === 0) {
      return {
        type: "array",
        items: {},
      };
    }

    // Generate schema for each item in the array
    const itemSchemas = json.map((item) => generateJsonSchema(item, options));

    // Group schemas by type for analysis
    const schemasByType: Record<string, any[]> = {};
    itemSchemas.forEach((schema) => {
      const type = Array.isArray(schema.type) ? "mixed" : schema.type;
      if (!schemasByType[type]) {
        schemasByType[type] = [];
      }
      schemasByType[type].push(schema);
    });

    const types = Object.keys(schemasByType);

    if (types.length === 1 && types[0] !== "mixed") {
      // All items have the same type
      const type = types[0];
      if (type === "object") {
        // For arrays of objects, merge the schemas
        const mergedSchema = mergeObjectSchemas(schemasByType[type]);
        return {
          type: "array",
          items: mergedSchema,
        };
      } else {
        // For arrays of primitives
        return {
          type: "array",
          items: { type },
        };
      }
    } else {
      // For mixed type arrays, use oneOf with unique schemas
      const uniqueSchemas = [
        ...new Map(
          itemSchemas.map((schema) => [JSON.stringify(schema), schema])
        ).values(),
      ];

      return {
        type: "array",
        items: {
          oneOf: uniqueSchemas,
        },
      };
    }
  }

  // Handle objects
  if (typeof json === "object") {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        properties[key] = generateJsonSchema(json[key], options);
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Handle strings - check for common formats
  if (typeof json === "string" && options.detectFormat !== false) {
    // Check for date format (ISO 8601)
    if (
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
        json
      )
    ) {
      return { type: "string", format: "date-time" };
    }

    // Check for email format
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(json)) {
      return { type: "string", format: "email" };
    }

    // Check for URI format
    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(json)) {
      return { type: "string", format: "uri" };
    }

    // Check for UUID format
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        json
      )
    ) {
      return { type: "string", format: "uuid" };
    }

    return { type: "string" };
  }

  // Handle numbers - distinguish between integers and floating point
  if (typeof json === "number") {
    return Number.isInteger(json) ? { type: "integer" } : { type: "number" };
  }

  // Handle other primitives (boolean, etc.)
  return { type: typeof json };
}

/**
 * Merge multiple object schemas into one
 * @param schemas Array of object schemas to merge
 * @returns A merged schema
 */
function mergeObjectSchemas(schemas: any[]): any {
  const allProperties = new Set<string>();

  // Collect all property names
  schemas.forEach((schema) => {
    if (schema.properties) {
      Object.keys(schema.properties).forEach((prop) => allProperties.add(prop));
    }
  });

  const mergedProperties: Record<string, any> = {};
  const requiredProperties = new Set<string>();

  // Find properties that appear in all schemas
  const schemasCount = schemas.length;
  allProperties.forEach((prop) => {
    let propCount = 0;
    const propSchemas: any[] = [];

    schemas.forEach((schema) => {
      if (schema.properties && schema.properties[prop]) {
        propCount++;
        propSchemas.push(schema.properties[prop]);

        // Check if this property is required in this schema
        if (schema.required && schema.required.includes(prop)) {
          requiredProperties.add(prop);
        }
      }
    });

    if (propCount > 0) {
      if (propSchemas.every((s) => s.type === propSchemas[0].type)) {
        // Same type across all schemas where this property appears
        mergedProperties[prop] = propSchemas[0];
      } else {
        // Different types - use oneOf with unique schemas
        const uniquePropSchemas = [
          ...new Map(
            propSchemas.map((schema) => [JSON.stringify(schema), schema])
          ).values(),
        ];

        mergedProperties[prop] = {
          oneOf: uniquePropSchemas,
        };
      }

      // If property doesn't exist in all schemas, it's not required in the merged schema
      if (propCount < schemasCount) {
        requiredProperties.delete(prop);
      }
    }
  });

  return {
    type: "object",
    properties: mergedProperties,
    required:
      requiredProperties.size > 0 ? Array.from(requiredProperties) : undefined,
  };
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
): any {
  try {
    const json = JSON.parse(jsonString);
    const schema = generateJsonSchema(json, options);

    // Determine which schema version to use
    let schemaUrl;
    switch (options.schemaVersion) {
      case "2019-09":
        schemaUrl = "https://json-schema.org/draft/2019-09/schema";
        break;
      case "2020-12":
        schemaUrl = "https://json-schema.org/draft/2020-12/schema";
        break;
      default:
        schemaUrl = "http://json-schema.org/draft-07/schema#";
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

// Export all the functions (including internal ones for testing purposes)
export { generateJsonSchema, mergeObjectSchemas };
