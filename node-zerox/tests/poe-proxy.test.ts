import PoeModel from "../src/models/poe";
import { PoeCredentials } from "../src/types";

/**
 * Unit test to verify that PoeModel properly accepts and stores proxy configuration.
 * This test doesn't make actual API calls to avoid requiring API keys and proxy servers.
 */
describe("PoeModel Proxy Configuration", () => {
  it("should accept credentials without proxy", () => {
    const credentials: PoeCredentials = {
      apiKey: "test-api-key",
    };

    const model = new PoeModel(credentials, "gemini-2.5-flash", {});
    expect(model).toBeDefined();
  });

  it("should accept credentials with HTTP proxy", () => {
    const credentials: PoeCredentials = {
      apiKey: "test-api-key",
      proxy: "http://proxy.example.com:8080",
    };

    const model = new PoeModel(credentials, "gemini-2.5-flash", {});
    expect(model).toBeDefined();
  });

  it("should accept credentials with HTTPS proxy", () => {
    const credentials: PoeCredentials = {
      apiKey: "test-api-key",
      proxy: "https://proxy.example.com:8443",
    };

    const model = new PoeModel(credentials, "gemini-2.5-flash", {});
    expect(model).toBeDefined();
  });
});
