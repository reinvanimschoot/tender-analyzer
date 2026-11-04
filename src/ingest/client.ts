import z from "zod";
import { env } from "../config.js";
import {
  DocumentsResponse,
  DownloadUrlResponse,
  SearchResponse,
  TokenResponse,
} from "./schema";
import { createHash } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

const BASE = "https://www.publicprocurement.be";

export async function getToken(): Promise<string> {
  const credentials = btoa(`${env.PP_CLIENT_ID}:${env.PP_CLIENT_SECRET}`);

  const response = await fetch(
    `${BASE}/auth/realms/supplier/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "openid",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Token request failed: ${body}`);
  }

  const data = TokenResponse.parse(await response.json());

  return data.access_token;
}

export async function searchPublications(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<SearchResponse> {
  const response = await fetch(`${BASE}/api/sea/search/publications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "BelGov-Trace-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({ includeOrganisationChildren: true, page, pageSize }),
  });

  if (!response.ok) {
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Search failed: ${response.status} ${body}`);
    }
  }

  return SearchResponse.parse(await response.json());
}

export async function getDocuments(
  token: string,
  workspaceId: string,
): Promise<DocumentsResponse> {
  const params = new URLSearchParams({ full: "false", type: "WORKSPACE" });

  const response = await fetch(
    `${BASE}/api/dos/publication-workspaces/${workspaceId}/documents?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "BelGov-Trace-Id": crypto.randomUUID(),
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Document fetch failed: ${response.status} ${body}`);
  }

  return DocumentsResponse.parse(await response.json());
}

export async function getDownloadUrl(
  token: string,
  versionId: string,
): Promise<string> {
  const response = await fetch(
    `${BASE}/api/dos/publication-workspace-document-versions/${versionId}/download-url`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "BelGov-Trace-Id": crypto.randomUUID(),
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Download url fetch failed: ${response.status} ${body}`);
  }

  const data = DownloadUrlResponse.parse(await response.json());

  return data.value;
}

export async function downloadFile(
  url: string,
  expectedHash: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());

  const hash = createHash("sha256").update(bytes).digest("hex");

  if (hash !== expectedHash) throw new Error(`Hash mismatch for ${fileName}`);

  const target = path.join(
    "data",
    "raw",
    `${hash}${path.extname(fileName).toLowerCase()}`,
  );

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);

  return target;
}
