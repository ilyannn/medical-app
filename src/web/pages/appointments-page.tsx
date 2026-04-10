import { createAppointmentSchema } from "@/shared/types";
import { usePersonScope } from "@/web/components/app-shell";
import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

export function AppointmentsPage() {
  const { personScope } = usePersonScope();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", personScope],
    queryFn: () => api.getAppointments(personScope),
  });
  const overviewQuery = useQuery({
    queryKey: ["overview", personScope],
    queryFn: () => api.getOverview(personScope),
  });
  const form = useForm({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      personId: personScope === "all" ? "me" : personScope,
      title: "",
      start: "2026-04-20T09:00:00.000Z",
      end: "2026-04-20T09:30:00.000Z",
      notes: "",
      externalEventId: "",
      doctorId: "",
      careAreaId: "",
    },
  });
  const people = overviewQuery.data?.filters.people ?? [];
  const mutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <section className="glass-panel rounded-[2rem] p-6">
        <h2 className="page-title text-2xl">{t("createAppointment")}</h2>
        <form
          className="mt-5 grid gap-3"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync({
              ...values,
              externalEventId: values.externalEventId || null,
              doctorId: values.doctorId || null,
              careAreaId: values.careAreaId || null,
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
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            placeholder="Appointment title"
            {...form.register("title")}
          />
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            placeholder="Start ISO"
            {...form.register("start")}
          />
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            placeholder="End ISO"
            {...form.register("end")}
          />
          <textarea
            className="min-h-28 rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
            placeholder="Notes"
            {...form.register("notes")}
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white"
          >
            Save appointment
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-[2rem] p-6">
        <h2 className="page-title text-2xl">{t("upcomingAppointments")}</h2>
        <div className="mt-5 space-y-4">
          {(appointmentsQuery.data ?? []).map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-[1.5rem] border border-[var(--line)] bg-white/50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{appointment.title}</p>
                <span className="text-sm text-[var(--muted)]">
                  {appointment.personId}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {new Date(appointment.start).toLocaleString()}
              </p>
              <p className="mt-2 text-sm leading-6">{appointment.notes}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
