import { usePersonScope } from "@/web/components/app-shell";
import { api } from "@/web/lib/api";
import { useQuery } from "@tanstack/react-query";

export function AreasPage() {
  const { personScope } = usePersonScope();
  const areasQuery = useQuery({
    queryKey: ["areas", personScope],
    queryFn: () => api.getAreas(personScope),
  });

  const areas = areasQuery.data as
    | Array<{
        id: string;
        name: string;
        description: string;
        notes: string;
        priority: string;
        doctorCount: number;
        documentCount: number;
        prescriptionCount: number;
      }>
    | undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {(areas ?? []).map((area) => (
        <article key={area.id} className="glass-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <h2 className="page-title text-2xl">{area.name}</h2>
            <span className="rounded-full bg-[rgba(15,118,110,0.1)] px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-[var(--teal)]">
              {area.priority}
            </span>
          </div>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            {area.description}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Doctors
              </p>
              <p className="mt-2 text-2xl font-semibold">{area.doctorCount}</p>
            </div>
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Documents
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {area.documentCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Rx
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {area.prescriptionCount}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium">Notes: {area.notes}</p>
        </article>
      ))}
    </div>
  );
}
