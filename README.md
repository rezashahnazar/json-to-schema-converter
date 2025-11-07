# JSON to Schema Converter

[![Tests](https://github.com/rezashahnazar/json-to-schema-converter/actions/workflows/test.yml/badge.svg)](https://github.com/rezashahnazar/json-to-schema-converter/actions/workflows/test.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![codecov](https://codecov.io/gh/rezashahnazar/json-to-schema-converter/branch/main/graph/badge.svg)](https://codecov.io/gh/rezashahnazar/json-to-schema-converter)

A TypeScript library for automatically generating JSON Schema from JSON objects or strings. Perfect for **LLM context optimization** - generate compact, token-efficient schemas from API responses to reduce prompt size while preserving essential structure.

## Features

- Convert any valid JSON to a JSON Schema
- **LLM-optimized schemas** - Remove validation metadata and limit depth to reduce token usage by 28%+
- Automatic detection of common string formats (date-time, email, URI, UUID)
- Support for all JSON Schema draft versions (07, 2019-09, 2020-12)
- Smart handling of arrays with mixed types
- Intelligent merging of object schemas
- Proper handling of required properties
- Depth limiting for nested structures (similar to `console.dir`)
- TypeScript type definitions included
- Zero dependencies

## Installation

```bash
npm install json-to-schema-converter
```

```bash
pnpm add json-to-schema-converter
```

```bash
yarn add json-to-schema-converter
```

## Quick Start

```typescript
import { jsonToSchema, objectToSchema } from "json-to-schema-converter";

const jsonString = `{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com"
}`;

const schema = jsonToSchema(jsonString);
console.log(JSON.stringify(schema, null, 2));
```

## Usage

### Basic Usage

```typescript
import { jsonToSchema } from "json-to-schema-converter";

const jsonString = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "email": "john.doe@example.com",
  "birthDate": "1990-01-01"
}`;

const schema = jsonToSchema(jsonString);
console.log(JSON.stringify(schema, null, 2));
```

### Working with JavaScript Objects

```typescript
import { objectToSchema } from "json-to-schema-converter";

const data = {
  users: [
    { id: 1, name: "Alice", active: true },
    { id: 2, name: "Bob", active: false },
  ],
};

const schema = objectToSchema(data);
console.log(JSON.stringify(schema, null, 2));
```

### Limiting Depth

Control how many nested levels are processed in detail, similar to `console.dir`:

```typescript
import { objectToSchema } from "json-to-schema-converter";

const deepObject = {
  level1: {
    level2: {
      level3: {
        value: "deep nested value",
      },
    },
  },
};

const fullSchema = objectToSchema(deepObject);
const limitedSchema = objectToSchema(deepObject, { depth: 2 });
const topLevelOnly = objectToSchema(deepObject, { depth: 0 });
```

### Optimizing for LLM Context

When working with LLMs, you often need to provide API response schemas as context. Using depth limiting and LLM optimization helps reduce token usage and focus on the most relevant structure.

**Example: Products API Response**

```typescript
import { jsonToSchema } from "json-to-schema-converter";

const apiUrl =
  "https://raw.githubusercontent.com/rezashahnazar/json-to-schema-converter/main/example/products-api-response.json";

const response = await fetch(apiUrl);
const jsonString = await response.text();

const optimizedSchema = jsonToSchema(jsonString, {
  depth: 4,
  optimizeForLLM: true,
});

const prompt = `Here's the API response schema:
${JSON.stringify(optimizedSchema)}

Based on this schema, what products are available?`;
```

**What the optimizations achieve:**

- **Depth limiting** (`depth: 4`): Simplifies deeply nested structures while preserving important fields
  - Product names are visible: `products[].name` is preserved as a string type
  - Structure is maintained: The array of products and their top-level properties remain
  - Deep nesting is simplified: Complex nested objects are reduced to `{"type":"object"}`
  - Noise is removed: Unnecessary deep structures are simplified

- **LLM optimization** (`optimizeForLLM: true`): Removes `required` arrays, saving 28% of tokens by removing validation metadata not needed for LLM understanding

**Result:**

The optimized schema (1,172 bytes, 28% smaller than original) preserves essential structure while eliminating unnecessary detail:

```json
{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"status":{"type":"string"},"message":{"type":"string"},"data":{"type":"object","properties":{"products":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"sku":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"price":{"type":"object"},"inventory":{"type":"object"},"specifications":{"type":"object"},"rating":{"type":"number"},"reviews":{"type":"integer"}}}},"pagination":{"type":"object","properties":{"currentPage":{"type":"integer"},"pageSize":{"type":"integer"},"totalPages":{"type":"integer"},"totalItems":{"type":"integer"},"hasNextPage":{"type":"boolean"},"hasPreviousPage":{"type":"boolean"},"nextPageUrl":{"type":"string"},"previousPageUrl":{"type":"null"}}},"metadata":{"type":"object","properties":{"requestId":{"type":"string"},"timestamp":{"type":"string","format":"date-time"},"responseTime":{"type":"object","properties":{"milliseconds":{"type":"integer"},"formatted":{"type":"string"}}},"server":{"type":"object","properties":{"name":{"type":"string"},"version":{"type":"string"},"region":{"type":"object"}}}}}}}}
```

Notice how `price`, `inventory`, and `specifications` are simplified to `{"type":"object"}` without their nested properties, while important fields like `name`, `id`, `sku`, and `rating` remain fully visible.

**Benefits:**

- Reduces context length: Deeply nested structures are simplified, saving tokens
- Preserves important structure: Key fields like product names remain visible
- Eliminates noise: Unnecessary nested details are removed
- Improves LLM understanding: Cleaner schemas lead to better responses

## API Reference

### `jsonToSchema(jsonString, options?)`

Parses a JSON string and generates a JSON Schema.

**Parameters:**

- `jsonString` (string): A valid JSON string
- `options` (JsonSchemaOptions, optional): Configuration options (see Options section)

**Returns:** A JSON Schema object

**Example:**

```typescript
const schema = jsonToSchema('{"name": "John", "age": 30}');
```

### `objectToSchema(value, options?)`

Generates a JSON Schema from a JavaScript value (object, array, primitive, etc.).

**Parameters:**

- `value` (any): Any JavaScript value (object, array, primitive, etc.)
- `options` (JsonSchemaOptions, optional): Configuration options (see Options section)

**Returns:** A JSON Schema object

**Example:**

```typescript
const schema = objectToSchema({ name: "John", age: 30 });
```

**Note:** Use `jsonToSchema` for JSON strings, and `objectToSchema` for JavaScript objects/values.

### `mergeObjectSchemas(schemas)`

Merges multiple object schemas into one.

**Parameters:**

- `schemas` (Array<JsonSchema>): Array of object schemas to merge

**Returns:** A merged JSON Schema object

**Example:**

```typescript
const schema1 = { type: "object", properties: { a: { type: "string" } } };
const schema2 = { type: "object", properties: { b: { type: "number" } } };
const merged = mergeObjectSchemas([schema1, schema2]);
```

## Options

| Option          | Type                           | Default | Description                                                                                                                                    |
| --------------- | ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `detectFormat`  | boolean                        | `true`  | Whether to detect and add format specifiers for common string patterns (date-time, email, URI, UUID)                                           |
| `schemaVersion` | "07" \| "2019-09" \| "2020-12" | "07"    | The JSON Schema draft version to use                                                                                                           |
| `depth`         | number \| null                 | `null`  | Maximum depth to process nested objects and arrays. When depth is reached, nested structures will be simplified. Set to `null` for unlimited depth. |
| `optimizeForLLM`| boolean                        | `false` | Optimize schema for LLM context by removing `required` arrays. Reduces token usage while preserving structure information.                    |

## How It Works

The library analyzes the structure and types of your JSON data and generates an appropriate JSON Schema that describes it. It handles:

- All primitive types (strings, numbers, booleans, null)
- Objects with properties and required fields
- Arrays (homogeneous and heterogeneous)
- Nested structures
- Common string formats (date-time, email, URI, UUID)
- Mixed type detection with `oneOf` schemas
- Intelligent schema merging for more accurate representations

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

When you submit a PR, GitHub Actions will automatically run tests on your code to ensure everything works correctly. The workflow runs tests on multiple Node.js versions (16.x, 18.x, 20.x) to ensure compatibility.

## Author

Reza Shahnazar ([@rezashahnazar](https://github.com/rezashahnazar))
