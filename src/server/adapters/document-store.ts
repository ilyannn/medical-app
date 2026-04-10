import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "@/server/config";

export class ICloudDocumentStore {
  constructor(private readonly config: AppConfig) {}

  async ensureManagedFolders() {
    await mkdir(this.config.documentRoot, { recursive: true });
    const folderNames = Object.values(this.config.personFolderMap);
    await Promise.all(
      folderNames.map(async (folder) => {
        await mkdir(path.join(this.config.documentRoot, folder), {
          recursive: true,
        });
      }),
    );
  }

  getManagedPersonFolder(personId: string): string {
    const folder = this.config.personFolderMap[personId];
    if (!folder) {
      throw new Error(`No managed folder configured for person ${personId}`);
    }
    return folder;
  }

  buildRelativePath(
    personId: string,
    documentDate: string,
    semanticName: string,
    extension = ".txt",
  ): string {
    const folder = this.getManagedPersonFolder(personId);
    const year = documentDate.slice(0, 4);
    const safeName = semanticName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .replace(/\s+/g, " ");
    return path.join(folder, year, `${documentDate} ${safeName}${extension}`);
  }

  resolveAbsolutePath(relativePath: string): string {
    return path.join(this.config.documentRoot, relativePath);
  }

  async writeManagedDocument(relativePath: string, content: string) {
    const absolutePath = this.resolveAbsolutePath(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }

  async importFromPaperless(
    personId: string,
    documentDate: string,
    semanticName: string,
    content: string,
  ): Promise<string> {
    const relativePath = this.buildRelativePath(
      personId,
      documentDate,
      semanticName,
    );
    await this.writeManagedDocument(relativePath, content);
    return relativePath.replaceAll("\\", "/");
  }

  async importUpload(
    personId: string,
    documentDate: string,
    semanticName: string,
    sourcePath: string,
  ): Promise<string> {
    const extension = path.extname(sourcePath) || ".txt";
    const relativePath = this.buildRelativePath(
      personId,
      documentDate,
      semanticName,
      extension,
    );
    const absolutePath = this.resolveAbsolutePath(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await copyFile(sourcePath, absolutePath);
    return relativePath.replaceAll("\\", "/");
  }

  async renameDocument(
    relativePath: string,
    personId: string,
    documentDate: string,
    semanticName: string,
  ) {
    const extension = path.extname(relativePath) || ".txt";
    const newRelativePath = this.buildRelativePath(
      personId,
      documentDate,
      semanticName,
      extension,
    );
    const currentAbsolute = this.resolveAbsolutePath(relativePath);
    const nextAbsolute = this.resolveAbsolutePath(newRelativePath);
    await mkdir(path.dirname(nextAbsolute), { recursive: true });
    await rename(currentAbsolute, nextAbsolute);
    return newRelativePath.replaceAll("\\", "/");
  }

  async readDocument(relativePath: string): Promise<string> {
    const absolutePath = this.resolveAbsolutePath(relativePath);
    return readFile(absolutePath, "utf8");
  }

  async exists(relativePath: string) {
    try {
      await stat(this.resolveAbsolutePath(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async listManagedTopLevelFolders() {
    await this.ensureManagedFolders();
    const entries = await readdir(this.config.documentRoot, {
      withFileTypes: true,
    });
    const managed = new Set(Object.values(this.config.personFolderMap));
    return entries
      .filter((entry) => entry.isDirectory() && managed.has(entry.name))
      .map((entry) => entry.name);
  }
}
