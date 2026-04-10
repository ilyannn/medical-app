import { createDoctorSchema } from "@/shared/types";
import { usePersonScope } from "@/web/components/app-shell";
import { DataTable } from "@/web/components/data-table";
import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export function DoctorsPage() {
  const { personScope } = usePersonScope();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
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

  const doctorForm = useForm({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      personId: personScope === "all" ? "me" : personScope,
      careAreaId: "",
      name: "",
      specialty: "",
      practiceName: "",
      preferredChannel: "Email",
      notes: "",
      macosContactId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: api.createDoctor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctors"] });
      await queryClient.invalidateQueries({ queryKey: ["areas"] });
      setOpen(false);
      doctorForm.reset();
    },
  });

  const columns = useMemo(
    () => [
      {
        header: "Doctor",
        accessorKey: "name",
      },
      {
        header: "Specialty",
        accessorKey: "specialty",
      },
      {
        header: "Practice",
        accessorKey: "practiceName",
      },
      {
        header: "Contact",
        cell: ({
          row,
        }: {
          row: {
            original: {
              contact?: { email?: string | null; phone?: string | null } | null;
            };
          };
        }) =>
          row.original.contact ? (
            <div className="text-sm text-[var(--muted)]">
              <div>{row.original.contact.email}</div>
              <div>{row.original.contact.phone}</div>
            </div>
          ) : (
            <span className="text-[var(--muted)]">No linked contact</span>
          ),
      },
      {
        header: "Notes",
        accessorKey: "notes",
      },
    ],
    [],
  );

  const people = overviewQuery.data?.filters.people ?? [];
  const areas =
    (areasQuery.data as
      | Array<{ id: string; name: string; personId: string }>
      | undefined) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title text-3xl">Doctors and practices</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The app stores medical context, while contact details resolve live
            through the macOS bridge.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[rgba(15,118,110,0.12)] px-4 py-2 text-sm font-medium text-[var(--teal)]"
          onClick={() => setOpen(true)}
        >
          {t("addDoctor")}
        </button>
      </div>
      <div className="glass-panel rounded-[2rem] p-5">
        <DataTable columns={columns} data={doctorsQuery.data ?? []} />
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-30">
        <DialogBackdrop className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <DialogPanel className="glass-panel w-full max-w-xl rounded-[2rem] p-6">
            <h3 className="page-title text-2xl">New doctor</h3>
            <form
              className="mt-4 grid gap-4"
              onSubmit={doctorForm.handleSubmit(async (values) => {
                await createMutation.mutateAsync({
                  ...values,
                  macosContactId: values.macosContactId || null,
                });
              })}
            >
              <label className="grid gap-1">
                <span className="text-sm font-medium">Person</span>
                <select
                  className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                  {...doctorForm.register("personId")}
                >
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Area</span>
                <select
                  className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                  {...doctorForm.register("careAreaId")}
                >
                  <option value="">Select an area</option>
                  {areas
                    .filter(
                      (area) => area.personId === doctorForm.watch("personId"),
                    )
                    .map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                </select>
              </label>
              <input
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                placeholder="Doctor name"
                {...doctorForm.register("name")}
              />
              <input
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                placeholder="Specialty"
                {...doctorForm.register("specialty")}
              />
              <input
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                placeholder="Practice"
                {...doctorForm.register("practiceName")}
              />
              <input
                className="rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                placeholder="macOS contact id (optional)"
                {...doctorForm.register("macosContactId")}
              />
              <textarea
                className="min-h-28 rounded-2xl border border-[var(--line)] bg-white/80 px-3 py-3"
                placeholder="Medical notes"
                {...doctorForm.register("notes")}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
