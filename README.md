# JSON to Schema Converter

[![Tests](https://github.com/rezashahnazar/json-to-schema-converter/actions/workflows/test.yml/badge.svg)](https://github.com/rezashahnazar/json-to-schema-converter/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/rezashahnazar/json-to-schema-converter/branch/main/graph/badge.svg)](https://codecov.io/gh/rezashahnazar/json-to-schema-converter)

A TypeScript library for automatically generating JSON Schema from JSON objects or strings.

## Features

- Convert any valid JSON to a JSON Schema
- Automatic detection of common string formats (date-time, email, URI, UUID)
- Support for all JSON Schema draft versions (07, 2019-09, 2020-12)
- Smart handling of arrays with mixed types
- Intelligent merging of object schemas
- Proper handling of required properties
- TypeScript type definitions included
- Zero dependencies

## Installation

Using npm:

```bash
npm install json-to-schema-converter
```

Using pnpm:

```bash
pnpm add json-to-schema-converter
```

Using yarn:

```bash
yarn add json-to-schema-converter
```

## Usage

### Basic Usage

```typescript
import { jsonToSchema } from "json-to-schema-converter";

// Your JSON string
const jsonString = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "email": "john.doe@example.com",
  "birthDate": "1990-01-01"
}`;

// Generate schema with default options
const schema = jsonToSchema(jsonString);

console.log(JSON.stringify(schema, null, 2));
```

### With Custom Options

```typescript
import { jsonToSchema } from "json-to-schema-converter";

const jsonString = `{
  "name": "John Doe",
  "email": "john.doe@example.com"
}`;

// Generate schema with custom options
const schema = jsonToSchema(jsonString, {
  detectFormat: true,
  schemaVersion: "2020-12",
});

console.log(JSON.stringify(schema, null, 2));
```

### Working with JavaScript Objects

```typescript
import { generateJsonSchema } from "json-to-schema-converter";

// Work directly with JavaScript objects
const data = {
  users: [
    { id: 1, name: "Alice", active: true },
    { id: 2, name: "Bob", active: false },
  ],
};

// Generate schema from object
const schema = generateJsonSchema(data);

console.log(JSON.stringify(schema, null, 2));
```

## API Reference

### `jsonToSchema(jsonString, options?)`

Parses a JSON string and generates a JSON Schema.

**Parameters:**

- `jsonString`: A valid JSON string
- `options`: Optional configuration (see Options section)

**Returns:** A JSON Schema object

### `generateJsonSchema(value, options?)`

Generates a JSON Schema from a JavaScript value.

**Parameters:**

- `value`: Any JavaScript value (object, array, primitive, etc.)
- `options`: Optional configuration (see Options section)

**Returns:** A JSON Schema object

### `mergeObjectSchemas(schemas)`

Merges multiple object schemas into one.

**Parameters:**

- `schemas`: Array of object schemas to merge

**Returns:** A merged JSON Schema object

## Options

| Option          | Type                           | Default | Description                                                            |
| --------------- | ------------------------------ | ------- | ---------------------------------------------------------------------- |
| `detectFormat`  | boolean                        | `true`  | Whether to detect and add format specifiers for common string patterns |
| `schemaVersion` | "07" \| "2019-09" \| "2020-12" | "07"    | The JSON Schema version to use                                         |

## How it works

The library analyzes the structure and types of your JSON data and generates an appropriate JSON Schema that describes it. It handles:

- All primitive types (strings, numbers, booleans, null)
- Objects with properties and required fields
- Arrays (homogeneous and heterogeneous)
- Nested structures
- Common string formats
- Mixed type detection with `oneOf` schemas

### Advanced Features in v2.0.0

- **Improved Array Handling**: Better detection of array item types, including mixed-type arrays
- **Smart Schema Merging**: Intelligently merges object schemas to create more accurate representations
- **Required Property Detection**: Properly identifies which properties should be marked as required
- **Schema Deduplication**: Removes duplicate schemas to create cleaner output

## License

MIT

## Contributing

Contributions are welcome! Here's how you can contribute to this project:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

When you submit a PR, GitHub Actions will automatically run tests on your code to ensure everything works correctly. The workflow runs tests on multiple Node.js versions (16.x, 18.x, 20.x) to ensure compatibility.

### Continuous Integration

This project uses GitHub Actions for continuous integration:

- **Automated Testing**: All tests are run automatically on push to main and on pull requests
- **Code Coverage**: Test coverage reports are generated and uploaded to Codecov
- **Multi-environment Testing**: Tests run on multiple Node.js versions

## Author

Reza Shahnazar ([@rezashahnazar](https://github.com/rezashahnazar))
