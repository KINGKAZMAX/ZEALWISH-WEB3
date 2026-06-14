import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageGenPayload, ImageGenResult } from "../../src/types";
import { resolveAvatarsDir } from "../capabilities/storage-paths";

function getEnvValue(key: string): string {
  return process.env[key] ?? "";
}

function getMimeTypeForExt(ext: string) {
  return ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
}

function getExtForMimeType(mimeType: string) {
  return mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
}

function getImageConfig(payload: ImageGenPayload) {
  return {
    aspectRatio: payload.imageConfig?.aspectRatio || payload.aspectRatio || "1:1",
    imageSize: payload.imageConfig?.imageSize || payload.imageSize || "1K",
  };
}

function getImageCacheKey(payload: ImageGenPayload, imageConfig: { aspectRatio: string; imageSize: string }) {
  if (payload.cacheKey?.trim()) {
    return payload.cacheKey.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  }

  return createHash("sha256")
    .update(JSON.stringify({
      provider: payload.provider || "openai",
      model: payload.model || getEnvValue("IMAGE_GEN_MODEL") || "gpt-image-2",
      prompt: payload.prompt,
      imageConfig,
    }))
    .digest("hex")
    .slice(0, 24);
}

async function readCachedImage(dir: string, characterId: string, cacheKey: string): Promise<ImageGenResult | null> {
  for (const ext of ["png", "jpg", "jpeg"]) {
    const filePath = path.join(dir, `${characterId}-${cacheKey}.${ext}`);
    try {
      const buffer = await readFile(filePath);
      return {
        imageBase64: buffer.toString("base64"),
        mimeType: getMimeTypeForExt(ext),
        savedPath: filePath,
        cached: true,
      };
    } catch {
      // Try the next extension.
    }
  }
  return null;
}

function getImageGenApiKey(): string {
  return getEnvValue("IMAGE_GEN_API_KEY") || getEnvValue("OPENAI_API_KEY") || getEnvValue("MARSWAVE_API_KEY");
}

function getImageGenBaseUrl(): string {
  return (getEnvValue("IMAGE_GEN_BASE_URL") || "https://api.marswave.ai/openapi/v1").replace(/\/$/, "");
}

function getImageGenModel(payload: ImageGenPayload): string {
  return payload.model || getEnvValue("IMAGE_GEN_MODEL") || "gpt-image-2";
}

function shouldUseOpenAIEndpoint(): boolean {
  const baseUrl = getImageGenBaseUrl();
  return (
    baseUrl.includes("openai-next.com") ||
    baseUrl.includes("api.openai.com") ||
    baseUrl.includes("moocoo.ai") ||
    getEnvValue("IMAGE_GEN_PROVIDER") === "openai" ||
    (Boolean(getEnvValue("IMAGE_GEN_API_KEY") || getEnvValue("OPENAI_API_KEY")) && !getEnvValue("MARSWAVE_API_KEY"))
  );
}

export async function generateImage(
  payload: ImageGenPayload,
  characterId = "char-001",
  dataRoot?: string,
): Promise<ImageGenResult> {
  const imageConfig = getImageConfig(payload);
  const dir = resolveAvatarsDir(dataRoot);
  const cacheKey = getImageCacheKey(payload, imageConfig);
  await mkdir(dir, { recursive: true });

  if (!payload.force) {
    const cached = await readCachedImage(dir, characterId, cacheKey);
    if (cached) {
      return cached;
    }
  }

  const apiKey = getImageGenApiKey();
  if (!apiKey) {
    throw new Error("No image generation API key configured (set IMAGE_GEN_API_KEY, OPENAI_API_KEY, or MARSWAVE_API_KEY)");
  }

  if (shouldUseOpenAIEndpoint()) {
    return generateImageOpenAI(payload, characterId, apiKey, dir, cacheKey, imageConfig);
  }

  return generateImageMarswave(payload, characterId, apiKey, dir, cacheKey, imageConfig);
}

async function generateImageOpenAI(
  payload: ImageGenPayload,
  characterId: string,
  apiKey: string,
  dir: string,
  cacheKey: string,
  _imageConfig: { aspectRatio: string; imageSize: string },
): Promise<ImageGenResult> {
  const baseUrl = getImageGenBaseUrl();
  const model = getImageGenModel(payload);

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: payload.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image gen failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const imageItem = data?.data?.[0];

  if (!imageItem?.b64_json) {
    throw new Error("Unexpected image gen response format: missing b64_json");
  }

  const imageBase64 = imageItem.b64_json;
  const mimeType = "image/png";
  const ext = "png";
  const cachedFilePath = path.join(dir, `${characterId}-${cacheKey}.${ext}`);
  const latestFilePath = path.join(dir, `${characterId}.${ext}`);

  const buffer = Buffer.from(imageBase64, "base64");
  await writeFile(cachedFilePath, buffer);
  await writeFile(latestFilePath, buffer);

  return {
    imageBase64,
    mimeType,
    savedPath: cachedFilePath,
    cached: false,
  };
}

async function generateImageMarswave(
  payload: ImageGenPayload,
  characterId: string,
  apiKey: string,
  dir: string,
  cacheKey: string,
  imageConfig: { aspectRatio: string; imageSize: string },
): Promise<ImageGenResult> {
  const response = await fetch(
    "https://api.marswave.ai/openapi/v1/images/generation",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "openai",
        model: "gpt-image-2",
        prompt: payload.prompt,
        imageConfig,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image gen failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

  if (!part?.data || !part?.mimeType) {
    throw new Error("Unexpected image gen response format");
  }

  const ext = getExtForMimeType(part.mimeType);
  const cachedFilePath = path.join(dir, `${characterId}-${cacheKey}.${ext}`);
  const latestFilePath = path.join(dir, `${characterId}.${ext}`);

  const buffer = Buffer.from(part.data, "base64");
  await writeFile(cachedFilePath, buffer);
  await writeFile(latestFilePath, buffer);

  return {
    imageBase64: part.data,
    mimeType: part.mimeType,
    savedPath: cachedFilePath,
    cached: false,
  };
}
