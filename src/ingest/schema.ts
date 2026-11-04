import { z } from "zod";

export const TokenResponse = z.object({
  access_token: z.string(),
});

const Title = z.object({
  language: z.string(),
  text: z.string(),
});

export const Publication = z.object({
  publicationWorkspaceId: z.string(),
  publicationDate: z.string(),
  dossier: z.object({
    titles: z.array(Title),
  }),
});
export type Publication = z.infer<typeof Publication>;

export const SearchResponse = z.object({
  totalCount: z.number(),
  publications: z.array(Publication),
});

export type SearchResponse = z.infer<typeof SearchResponse>;

const DocumentVersion = z.object({
  id: z.string(),
  createdAt: z.string(),
  document: z.object({
    originalFileName: z.string(),
    fileHash: z.string(),
  }),
});

export const WorkspaceDocument = z.object({
  id: z.string(),
  versions: z.array(DocumentVersion),
});

export type WorkspaceDocument = z.infer<typeof WorkspaceDocument>;

export const DocumentsResponse = z.array(WorkspaceDocument);
export type DocumentsResponse = z.infer<typeof DocumentsResponse>;

export const DownloadUrlResponse = z.object({
  value: z.string(),
});

export type DownloadUrlResponse = z.infer<typeof DownloadUrlResponse>;
