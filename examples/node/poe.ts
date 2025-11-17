import { ModelProvider } from "zerox/node-zerox/dist/types";
import { zerox } from "zerox";

/**
 * Example using Poe.com API with Zerox to extract structured data from documents.
 * This shows how to use the Poe provider, which is compatible with OpenAI's API format.
 * 
 * Poe supports various models including Gemini models through their API.
 * You can get your API key from https://poe.com/api_key
 */
async function main() {
  // Define the schema for property report data extraction
  const schema = {
    type: "object",
    properties: {
      commercial_office: {
        type: "object",
        properties: {
          average: { type: "string" },
          median: { type: "string" },
        },
        required: ["average", "median"],
      },
      transactions_by_quarter: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quarter: { type: "string" },
            transactions: { type: "integer" },
          },
          required: ["quarter", "transactions"],
        },
      },
      year: { type: "integer" },
    },
    required: ["commercial_office", "transactions_by_quarter", "year"],
  };

  try {
    const result = await zerox({
      credentials: {
        apiKey: process.env.POE_API_KEY || "",
        // Optional: Configure proxy for Poe API requests
        // proxy: "http://proxy.example.com:8080",
      },
      extractOnly: true, // Skip OCR, only perform extraction (defaults to false)
      filePath:
        "https://omni-demo-data.s3.amazonaws.com/test/property_report.png",
      // Use any model supported by Poe (e.g., "gemini-2.5-flash", "gpt-4o-mini", etc.)
      model: "gemini-2.5-flash",
      modelProvider: ModelProvider.POE,
      schema,
    });
    console.log("Extracted data:", result.extracted);
  } catch (error) {
    console.error("Error extracting data:", error);
  }
}

main();
