import { jsonToSchema } from "../src/index";
import { writeFileSync } from "fs";

async function generateOptimizedSchema() {
  const apiUrl =
    "https://raw.githubusercontent.com/rezashahnazar/json-to-schema-converter/main/example/products-api-response.json";

  console.log("Fetching API response...");
  const response = await fetch(apiUrl);
  const jsonString = await response.text();

  console.log("Generating optimized schema with depth: 4 and optimizeForLLM: true...");
  const optimizedSchema = jsonToSchema(jsonString, {
    depth: 4,
    schemaVersion: "2020-12",
    optimizeForLLM: true,
  });

  const outputPath = "./example/optimized-schema-output.json";
  writeFileSync(outputPath, JSON.stringify(optimizedSchema));
  console.log(`Optimized schema saved to ${outputPath}`);

  const schemaWithoutOptimization = jsonToSchema(jsonString, {
    depth: 4,
    schemaVersion: "2020-12",
  });

  const originalSize = JSON.stringify(schemaWithoutOptimization).length;
  const optimizedSize = JSON.stringify(optimizedSchema).length;

  console.log(`\nSize comparison:`);
  console.log(`Original (with required): ${originalSize} bytes`);
  console.log(
    `Optimized (no required, minified): ${optimizedSize} bytes (${(
      (1 - optimizedSize / originalSize) *
      100
    ).toFixed(1)}% reduction)`
  );
}

generateOptimizedSchema().catch(console.error);
