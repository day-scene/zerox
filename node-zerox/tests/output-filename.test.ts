import { zerox } from "../src";
import { ModelOptions } from "../src/types";
import fs from "fs-extra";
import path from "path";
import os from "os";

/**
 * Test to verify outputFilename parameter works correctly
 */
async function testOutputFilename() {
  const testOutputDir = path.join(os.tmpdir(), "zerox-test-output");
  const testTempDir = path.join(os.tmpdir(), "zerox-test-temp");
  const customFilename = "my-custom-filename";

  // Clean up test directories
  await fs.remove(testOutputDir);
  await fs.remove(testTempDir);
  await fs.ensureDir(testOutputDir);

  try {
    // Test with a simple image URL
    const result = await zerox({
      cleanup: true,
      filePath: "https://omni-demo-data.s3.amazonaws.com/test/cs101.pdf",
      credentials: {
        apiKey: process.env.OPENAI_API_KEY || "",
      },
      model: ModelOptions.OPENAI_GPT_4O_MINI,
      outputDir: testOutputDir,
      outputFilename: customFilename,
      pagesToConvertAsImages: 1, // Only process first page for speed
    });

    // Verify the fileName in the result matches our custom filename
    if (result.fileName !== customFilename) {
      throw new Error(
        `Expected fileName to be "${customFilename}", but got "${result.fileName}"`
      );
    }

    // Verify the output file was created with the correct name
    const expectedFilePath = path.join(testOutputDir, `${customFilename}.md`);
    if (!fs.existsSync(expectedFilePath)) {
      throw new Error(`Expected output file not found: ${expectedFilePath}`);
    }

    console.log("✅ Test passed: outputFilename parameter works correctly");
    console.log(`  - Result fileName: ${result.fileName}`);
    console.log(`  - Output file created: ${expectedFilePath}`);

    // Verify temp directory naming (check if any temp dir with custom name exists)
    const tempDirs = fs.readdirSync(os.tmpdir()).filter(dir => 
      dir.startsWith(`zerox-temp-${customFilename}`)
    );
    
    if (tempDirs.length === 0) {
      console.log("  - Temp directory was cleaned up (cleanup=true)");
    } else {
      console.log(`  - Warning: Temp directory still exists: ${tempDirs[0]}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    // Clean up test directories
    await fs.remove(testOutputDir);
    await fs.remove(testTempDir);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOutputFilename()
    .then(() => {
      console.log("\nAll tests passed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed with error:", error);
      process.exit(1);
    });
}

export { testOutputFilename };
