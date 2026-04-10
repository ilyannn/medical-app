import { usePersonScope } from "@/web/components/app-shell";
import { api } from "@/web/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function DocumentsPage() {
  const { personScope } = usePersonScope();
  const [paperlessQuery, setPaperlessQuery] = useState("");
  const queryClient = useQueryClient();
  const documentsQuery = useQuery({
    queryKey: ["documents", personScope],
    queryFn: () => api.getDocuments(personScope),
  });
  const paperlessDocsQuery = useQuery({
    queryKey: ["paperless", paperlessQuery],
    queryFn: () => api.searchPaperless(paperlessQuery),
  });
  const importMutation = useMutation({
    mutationFn: api.importPaperless,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const renameMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: { id: string; body: { semanticName: string; documentDate: string } }) =>
      api.renameDocument(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const documents =
    (documentsQuery.data as
      | Array<{
          id: string;
          personId: string;
          semanticName: string;
          relativePath: string;
          documentDate: string;
          documentType: string;
        }>
      | undefined) ?? [];
  const paperlessDocs =
    (paperlessDocsQuery.data as
      | Array<{
          id: string;
          title: string;
          documentDate: string;
          documentType: string;
          content: string;
        }>
      | undefined) ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <section
        data-testid="documents-managed-section"
        className="glass-panel rounded-[2rem] p-6"
      >
        <h2 className="page-title text-2xl">Managed iCloud documents</h2>
        <div className="mt-4 space-y-3">
          {documents.map((document) => (
            <article
              key={document.id}
              data-testid={`managed-document-${document.id}`}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{document.semanticName}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {document.relativePath}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
                  onClick={() =>
                    renameMutation.mutate({
                      id: document.id,
                      body: {
                        semanticName: `${document.semanticName} updated`,
                        documentDate: document.documentDate,
                      },
                    })
                  }
                >
                  Rename
                </button>
              </div>
              <div className="mt-3 flex gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <span>{document.personId}</span>
                <span>{document.documentType}</span>
                <span>{document.documentDate}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        data-testid="paperless-import-section"
        className="glass-panel rounded-[2rem] p-6"
      >
        <h2 className="page-title text-2xl">Paperless import</h2>
        <input
          className="mt-4 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3"
          value={paperlessQuery}
          onChange={(event) => setPaperlessQuery(event.target.value)}
          placeholder="Search Paperless import source"
        />
        <div className="mt-4 space-y-3">
          {paperlessDocs.map((document) => (
            <article
              key={document.id}
              data-testid={`paperless-document-${document.id}`}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/50 p-4"
            >
              <p className="font-semibold">{document.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {document.content}
              </p>
              <button
                type="button"
                data-testid={`import-paperless-${document.id}`}
                className="mt-3 rounded-full bg-[rgba(15,118,110,0.12)] px-4 py-2 text-sm font-medium text-[var(--teal)]"
                onClick={() =>
                  importMutation.mutate({
                    personId: personScope === "all" ? "me" : personScope,
                    careAreaId: null,
                    paperlessId: document.id,
                    semanticName: document.title,
                    documentDate: document.documentDate,
                    documentType: document.documentType,
                    extractedText: document.content,
                    links: [],
                  })
                }
              >
                Import into managed folder
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
