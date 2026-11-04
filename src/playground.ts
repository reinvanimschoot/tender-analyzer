import {
  downloadFile,
  getDocuments,
  getDownloadUrl,
  getToken,
  searchPublications,
} from "./ingest/client.js";

const token = await getToken();
const result = await searchPublications(token, 1, 10);
const subset = result.publications
  .slice(0, 10)
  .map((pub) => pub.publicationWorkspaceId);

const documents = await getDocuments(token, subset[1] as string);

const csc = documents.find((doc) =>
  doc.versions.at(-1)?.document.originalFileName.includes("CSC"),
);

const version = csc?.versions.at(-1);
if (!version) throw new Error("No CSC found");

const url = await getDownloadUrl(token, version.id);
const saved = await downloadFile(
  url,
  version.document.fileHash,
  version.document.originalFileName,
);
console.log("Saved to", saved);
