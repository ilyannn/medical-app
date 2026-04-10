import type { AppConfig } from "@/server/config";
import { demoPaperlessDocuments } from "@/test/fixtures/demo-data";

export interface PaperlessDocument {
  id: string;
  title: string;
  documentDate: string;
  content: string;
  documentType: string;
}

export interface PaperlessClient {
  search(query?: string): Promise<PaperlessDocument[]>;
  getById(id: string): Promise<PaperlessDocument | null>;
}

export class FakePaperlessClient implements PaperlessClient {
  async search(query = ""): Promise<PaperlessDocument[]> {
    const normalized = query.toLowerCase();
    return demoPaperlessDocuments.filter((document) =>
      `${document.title} ${document.content}`
        .toLowerCase()
        .includes(normalized),
    );
  }

  async getById(id: string): Promise<PaperlessDocument | null> {
    return (
      demoPaperlessDocuments.find((document) => document.id === id) ?? null
    );
  }
}

export class HttpPaperlessClient implements PaperlessClient {
  constructor(private readonly config: AppConfig) {}

  private get headers() {
    return {
      Authorization: `Token ${this.config.paperless.token}`,
    };
  }

  async search(query = ""): Promise<PaperlessDocument[]> {
    if (!this.config.paperless.baseUrl || !this.config.paperless.token) {
      return [];
    }

    const url = new URL("/api/documents/", this.config.paperless.baseUrl);
    if (query) {
      url.searchParams.set("query", query);
    }

    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Paperless search failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        id: number;
        title: string;
        content?: string;
        created?: string;
        document_type?: string;
      }>;
    };

    return (payload.results ?? []).map((entry) => ({
      id: String(entry.id),
      title: entry.title,
      documentDate:
        entry.created?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      content: entry.content ?? "",
      documentType: entry.document_type ?? "paperless",
    }));
  }

  async getById(id: string): Promise<PaperlessDocument | null> {
    const results = await this.search(id);
    return results.find((document) => document.id === id) ?? null;
  }
}

export function createPaperlessClient(config: AppConfig): PaperlessClient {
  return config.paperless.mode === "http"
    ? new HttpPaperlessClient(config)
    : new FakePaperlessClient();
}
