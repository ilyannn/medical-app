import { generateDraftSchema } from "@/shared/types";
import { usePersonScope } from "@/web/components/app-shell";
import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

export function DraftsPage() {
  const { personScope } = usePersonScope();
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const draftsQuery = useQuery({
    queryKey: ["drafts", personScope],
    queryFn: () => api.getDrafts(personScope),
  });
  const doctorsQuery = useQuery({
    queryKey: ["doctors", personScope],
    queryFn: () => api.getDoctors(personScope),
  });
  const areasQuery = useQuery({
    queryKey: ["areas", personScope],
    queryFn: () => api.getAreas(personScope),
  });
  const overviewQuery = useQuery({
    queryKey: ["overview", personScope],
    queryFn: () => api.getOverview(personScope),
  });

  const form = useForm({
    resolver: zodResolver(generateDraftSchema),
    defaultValues: {
      personId: personScope === "all" ? "me" : personScope,
      careAreaId: "",
      doctorId: "",
      intent: "Follow-up question",
      locale,
      keyFacts: ["Need a concise update on the current status"],
    },
  });

  const mutation = useMutation({
    mutationFn: api.generateDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["drafts"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });

  const people = overviewQuery.data?.filters.people ?? [];
  const doctors = doctorsQuery.data ?? [];
  const areas =
    (areasQuery.data as
      | Array<{ id: string; name: string; personId: string }>
      | undefined) ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <section className="glass-panel rounded-[2rem] p-6">
        <h2 className="page-title text-2xl">{t("createDraft")}</h2>
        <form
          className="mt-5 grid gap-3"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync({
              ...values,
              careAreaId: values.careAreaId || null,
              doctorId: values.doctorId || null,
              keyFacts: values.keyFacts,
            });
          })}
        >
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            {...form.register("personId")}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            {...form.register("careAreaId")}
          >
            <option value="">Area</option>
            {areas
              .filter((area) => area.personId === form.watch("personId"))
              .map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
          </select>
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            {...form.register("doctorId")}
          >
            <option value="">Doctor</option>
            {doctors
              .filter((doctor) => doctor.personId === form.watch("personId"))
              .map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
          </select>
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            {...form.register("intent")}
          />
          <textarea
            className="min-h-32 rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            value={(form.watch("keyFacts") ?? []).join("\n")}
            onChange={(event) =>
              form.setValue(
                "keyFacts",
                event.target.value.split("\n").filter(Boolean),
              )
            }
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white"
          >
            Generate draft
          </button>
        </form>
      </section>

      <section
        data-testid="recent-drafts-section"
        className="glass-panel rounded-[2rem] p-6"
      >
        <h2 className="page-title text-2xl">{t("recentDrafts")}</h2>
        <div className="mt-5 space-y-4">
          {(draftsQuery.data ?? []).map((draft) => (
            <article
              key={draft.id}
              data-testid={`draft-card-${draft.id}`}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{draft.subject}</p>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {draft.locale}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{draft.intent}</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-6">
                {draft.body}
              </pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
