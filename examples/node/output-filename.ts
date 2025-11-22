import { zerox } from "zerox";
import { ModelOptions } from "zerox/node-zerox/dist/types";
import path from "path";

/**
 * Example demonstrating the use of outputFilename parameter
 * This allows you to specify a custom filename instead of using a randomly generated one
 */
async function main() {
  try {
    // Example 1: Using outputFilename for consistent naming
    const result = await zerox({
      filePath: "https://omni-demo-data.s3.amazonaws.com/test/cs101.pdf",
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || "",
      },
      model: ModelOptions.OPENAI_GPT_4O_MINI,
      outputDir: "./output", // Directory to save the markdown file
      outputFilename: "cs101-lecture-notes", // Custom filename instead of random
      pagesToConvertAsImages: 1, // Process only first page
    });

    console.log("OCR completed successfully!");
    console.log(`Output file name: ${result.fileName}`);
    console.log(`Total pages processed: ${result.pages.length}`);
    console.log(`Completion time: ${result.completionTime}ms`);

    // The markdown file will be saved as "./output/cs101-lecture-notes.md"
    // The temp directory will be named "zerox-temp-cs101-lecture-notes"

    console.log("\nExample 2: Without outputFilename (default behavior)");
    
    const result2 = await zerox({
      filePath: "https://omni-demo-data.s3.amazonaws.com/test/invoice.pdf",
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || "",
      },
      model: ModelOptions.OPENAI_GPT_4O_MINI,
      pagesToConvertAsImages: 1,
    });

    console.log(`Output file name (auto-generated): ${result2.fileName}`);
    // The filename will be automatically generated from the input file path

  } catch (error) {
    console.error("Error during OCR:", error);
  }
}

main();
