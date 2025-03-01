/**
 * Example of how to use the json-to-schema-converter package
 */

import { jsonToSchema } from "../src";

// Example JSON string
const exampleJson = `{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  },
  "phoneNumbers": [
    {
      "type": "home",
      "number": "555-1234"
    },
    {
      "type": "work",
      "number": "555-5678"
    }
  ],
  "email": "john.doe@example.com",
  "birthDate": "1990-01-01"
}`;

// Generate JSON Schema with format detection
const schema = jsonToSchema(exampleJson, {
  detectFormat: true,
  schemaVersion: "2020-12",
});

// Output the generated schema
console.log(JSON.stringify(schema, null, 2));
