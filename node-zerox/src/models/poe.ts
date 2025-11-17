import {
  CompletionArgs,
  CompletionResponse,
  ExtractionArgs,
  ExtractionResponse,
  MessageContentArgs,
  ModelInterface,
  PoeCredentials,
  PoeLLMParams,
  OperationMode,
} from "../types";
import {
  cleanupImage,
  convertKeysToCamelCase,
  convertKeysToSnakeCase,
  encodeImageToBase64,
} from "../utils";
import { CONSISTENCY_PROMPT, SYSTEM_PROMPT_BASE } from "../constants";
import axios, { AxiosInstance } from "axios";
import fs from "fs-extra";
import { ProxyAgent } from "undici";

export default class PoeModel implements ModelInterface {
  private apiKey: string;
  private model: string;
  private llmParams?: Partial<PoeLLMParams>;
  private axiosInstance: AxiosInstance;

  constructor(
    credentials: PoeCredentials,
    model: string,
    llmParams?: Partial<PoeLLMParams>
  ) {
    this.apiKey = credentials.apiKey;
    this.model = model;
    this.llmParams = llmParams;

    // Configure axios instance with optional proxy
    const axiosConfig: any = {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };

    // Add proxy configuration if provided
    if (credentials.proxy) {
      const proxyAgent = new ProxyAgent(credentials.proxy);
      axiosConfig.httpAgent = proxyAgent;
      axiosConfig.httpsAgent = proxyAgent;
    }

    this.axiosInstance = axios.create(axiosConfig);
  }

  async getCompletion(
    mode: OperationMode,
    params: CompletionArgs | ExtractionArgs
  ): Promise<CompletionResponse | ExtractionResponse> {
    const modeHandlers = {
      [OperationMode.EXTRACTION]: () =>
        this.handleExtraction(params as ExtractionArgs),
      [OperationMode.OCR]: () => this.handleOCR(params as CompletionArgs),
    };

    const handler = modeHandlers[mode];
    if (!handler) {
      throw new Error(`Unsupported operation mode: ${mode}`);
    }

    return await handler();
  }

  private async createMessageContent({
    input,
    options,
  }: MessageContentArgs): Promise<any> {
    const processImages = async (imagePaths: string[]) => {
      const nestedImages = await Promise.all(
        imagePaths.map(async (imagePath) => {
          const imageBuffer = await fs.readFile(imagePath);
          const buffers = await cleanupImage({
            correctOrientation: options?.correctOrientation ?? false,
            imageBuffer,
            scheduler: options?.scheduler ?? null,
            trimEdges: options?.trimEdges ?? false,
          });
          return buffers.map((buffer) => ({
            image_url: {
              url: `data:image/png;base64,${encodeImageToBase64(buffer)}`,
            },
            type: "image_url",
          }));
        })
      );
      return nestedImages.flat();
    };

    if (Array.isArray(input)) {
      return processImages(input);
    }

    if (typeof input === "string") {
      return [{ text: input, type: "text" }];
    }

    const { imagePaths, text } = input;
    const images = await processImages(imagePaths);
    return [...images, { text, type: "text" }];
  }

  private async handleOCR({
    buffers,
    maintainFormat,
    priorPage,
    prompt,
  }: CompletionArgs): Promise<CompletionResponse> {
    const systemPrompt = prompt || SYSTEM_PROMPT_BASE;

    // Default system message
    const messages: any = [{ role: "system", content: systemPrompt }];

    // If content has already been generated, add it to context.
    // This helps maintain the same format across pages
    if (maintainFormat && priorPage && priorPage.length) {
      messages.push({
        role: "system",
        content: CONSISTENCY_PROMPT(priorPage),
      });
    }

    // Add image to request
    const imageContents = buffers.map((buffer) => ({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${encodeImageToBase64(buffer)}`,
      },
    }));
    messages.push({ role: "user", content: imageContents });

    try {
      const response = await this.axiosInstance.post(
        "https://api.poe.com/v1/chat/completions",
        {
          messages,
          model: this.model,
          ...convertKeysToSnakeCase(this.llmParams ?? null),
        }
      );

      const data = response.data;

      const result: CompletionResponse = {
        content: data.choices[0].message.content,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      };

      if (this.llmParams?.logprobs) {
        result["logprobs"] = convertKeysToCamelCase(
          data.choices[0].logprobs
        )?.content;
      }

      return result;
    } catch (err) {
      console.error("Error in Poe completion", err);
      throw err;
    }
  }

  private async handleExtraction({
    input,
    options,
    prompt,
    schema,
  }: ExtractionArgs): Promise<ExtractionResponse> {
    try {
      const messages: any = [];

      if (prompt) {
        messages.push({ role: "system", content: prompt });
      }

      messages.push({
        role: "user",
        content: await this.createMessageContent({ input, options }),
      });

      const response = await this.axiosInstance.post(
        "https://api.poe.com/v1/chat/completions",
        {
          messages,
          model: this.model,
          response_format: {
            json_schema: { name: "extraction", schema },
            type: "json_schema",
          },
          ...convertKeysToSnakeCase(this.llmParams ?? null),
        }
      );

      const data = response.data;

      const result: ExtractionResponse = {
        extracted: data.choices[0].message.content,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      };

      if (this.llmParams?.logprobs) {
        result["logprobs"] = convertKeysToCamelCase(
          data.choices[0].logprobs
        )?.content;
      }

      return result;
    } catch (err) {
      console.error("Error in Poe completion", err);
      throw err;
    }
  }
}
