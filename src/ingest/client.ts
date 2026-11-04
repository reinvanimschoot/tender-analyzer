import { createHash } from "crypto";
import { apiRequest, BASE } from "./helpers";
import {
  DocumentsResponse,
  DownloadUrlResponse,
  SearchResponse,
  TokenResponse,
} from "./schema";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { env } from "../config";

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
    const text = await response.text();

    throw new Error(`Token request failed: ${response.status} ${text}`);
  }

  const data = TokenResponse.parse(await response.json());

  return data.access_token;
}

export async function searchPublications(
  token: string,
  page = 1,
  pageSize = 25,
): Promise<SearchResponse> {
  const data = await apiRequest(token, "/api/sea/search/publications", {
    method: "POST",
    body: { includeOrganisationChildren: true, page, pageSize },
  });

  return SearchResponse.parse(data);
}

export async function getDocuments(
  token: string,
  workspaceId: string,
): Promise<DocumentsResponse> {
  const params = new URLSearchParams({ full: "false", type: "WORKSPACE" });

  const data = await apiRequest(
    token,
    `/api/dos/publication-workspaces/${workspaceId}/documents?${params}`,
  );

  return DocumentsResponse.parse(data);
}

export async function getDownloadUrl(
  token: string,
  versionId: string,
): Promise<string> {
  const params = new URLSearchParams({ unpublished: "false" });
  const data = await apiRequest(
    token,
    `/api/dos/publication-workspace-document-versions/${versionId}/download-url?${params}`,
  );

  return DownloadUrlResponse.parse(data).value;
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
