# JSON to Schema Converter

A TypeScript library for automatically generating JSON Schema from JSON objects or strings.

## Features

- Convert any valid JSON to a JSON Schema
- Automatic detection of common string formats (date-time, email, URI, UUID)
- Support for all JSON Schema draft versions (07, 2019-09, 2020-12)
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

// Or with custom options
const schemaWithOptions = jsonToSchema(jsonString, {
  detectFormat: true,
  schemaVersion: "2020-12",
});

console.log(JSON.stringify(schemaWithOptions, null, 2));
```

### Options

The `jsonToSchema` function accepts the following options:

| Option          | Type                           | Default | Description                                                            |
| --------------- | ------------------------------ | ------- | ---------------------------------------------------------------------- |
| `detectFormat`  | boolean                        | `true`  | Whether to detect and add format specifiers for common string patterns |
| `schemaVersion` | "07" \| "2019-09" \| "2020-12" | "07"    | The JSON Schema version to use                                         |

## How it works

The library analyzes the structure and types of your JSON data and generates an appropriate JSON Schema that describes it. It handles:

- All primitive types (strings, numbers, booleans, null)
- Objects with properties
- Arrays (homogeneous and heterogeneous)
- Nested structures
- Common string formats

## License

MIT

## Author

Reza Shahnazar ([@rezashahnazar](https://github.com/rezashahnazar))
