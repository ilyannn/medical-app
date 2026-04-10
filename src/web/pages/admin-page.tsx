import {
  createBillSchema,
  createPrescriptionSchema,
  createReimbursementSchema,
} from "@/shared/types";
import { usePersonScope } from "@/web/components/app-shell";
import { DataTable } from "@/web/components/data-table";
import { MetricCard } from "@/web/components/metric-card";
import { api } from "@/web/lib/api";
import { useLocale } from "@/web/lib/i18n";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

function QuickCreateForm({
  type,
  personScope,
}: {
  type: "prescription" | "bill" | "reimbursement";
  personScope: string;
}) {
  const queryClient = useQueryClient();
  const overviewQuery = useQuery({
    queryKey: ["overview", personScope],
    queryFn: () => api.getOverview(personScope),
  });
  const areasQuery = useQuery({
    queryKey: ["areas", personScope],
    queryFn: () => api.getAreas(personScope),
  });
  const doctorsQuery = useQuery({
    queryKey: ["doctors", personScope],
    queryFn: () => api.getDoctors(personScope),
  });
  const billsQuery = useQuery({
    queryKey: ["bills", personScope],
    queryFn: () => api.getBills(personScope),
  });
  const people = overviewQuery.data?.filters.people ?? [];

  const prescriptionForm = useForm({
    resolver: zodResolver(createPrescriptionSchema),
    defaultValues: {
      personId: personScope === "all" ? "me" : personScope,
      careAreaId: "",
      doctorId: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      issuedOn: new Date().toISOString().slice(0, 10),
      renewalDueOn: "",
      status: "active" as const,
      notes: "",
    },
  });
  const billForm = useForm({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      personId: personScope === "all" ? "me" : personScope,
      careAreaId: "",
      doctorId: "",
      label: "",
      amountCents: 0,
      currency: "EUR",
      incurredOn: new Date().toISOString().slice(0, 10),
      status: "new" as const,
      notes: "",
    },
  });
  const reimbursementForm = useForm({
    resolver: zodResolver(createReimbursementSchema),
    defaultValues: {
      personId: personScope === "all" ? "wife" : personScope,
      billId: "",
      payerName: "",
      submittedOn: new Date().toISOString().slice(0, 10),
      reimbursedOn: "",
      amountCents: 0,
      reimbursedCents: 0,
      status: "submitted" as const,
      notes: "",
    },
  });

  const createPrescription = useMutation({
    mutationFn: api.createPrescription,
    onSuccess: async () => {
      prescriptionForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const createBill = useMutation({
    mutationFn: api.createBill,
    onSuccess: async () => {
      billForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
  const createReimbursement = useMutation({
    mutationFn: api.createReimbursement,
    onSuccess: async () => {
      reimbursementForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });

  const areaOptions =
    (areasQuery.data as
      | Array<{ id: string; name: string; personId: string }>
      | undefined) ?? [];
  const doctorOptions = doctorsQuery.data ?? [];
  const billOptions = billsQuery.data ?? [];

  if (type === "prescription") {
    return (
      <form
        className="mt-5 grid gap-3"
        onSubmit={prescriptionForm.handleSubmit(async (values) => {
          await createPrescription.mutateAsync({
            ...values,
            renewalDueOn: values.renewalDueOn || null,
          });
        })}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            {...prescriptionForm.register("personId")}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            {...prescriptionForm.register("careAreaId")}
          >
            <option value="">Area</option>
            {areaOptions
              .filter(
                (area) => area.personId === prescriptionForm.watch("personId"),
              )
              .map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
          </select>
        </div>
        <select
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          {...prescriptionForm.register("doctorId")}
        >
          <option value="">Doctor</option>
          {doctorOptions
            .filter(
              (doctor) =>
                doctor.personId === prescriptionForm.watch("personId"),
            )
            .map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
        </select>
        <input
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          placeholder="Medication"
          {...prescriptionForm.register("medicationName")}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            placeholder="Dosage"
            {...prescriptionForm.register("dosage")}
          />
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            placeholder="Frequency"
            {...prescriptionForm.register("frequency")}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-medium text-white"
        >
          Save prescription
        </button>
      </form>
    );
  }

  if (type === "bill") {
    return (
      <form
        className="mt-5 grid gap-3"
        onSubmit={billForm.handleSubmit(async (values) => {
          await createBill.mutateAsync({
            ...values,
            amountCents: Number(values.amountCents),
            careAreaId: values.careAreaId || null,
            doctorId: values.doctorId || null,
          });
        })}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            {...billForm.register("personId")}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            placeholder="Label"
            {...billForm.register("label")}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="number"
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            placeholder="Amount in cents"
            {...billForm.register("amountCents", { valueAsNumber: true })}
          />
          <select
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
            {...billForm.register("doctorId")}
          >
            <option value="">Doctor</option>
            {doctorOptions
              .filter(
                (doctor) => doctor.personId === billForm.watch("personId"),
              )
              .map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-[var(--amber)] px-4 py-2 text-sm font-medium text-white"
        >
          Save bill
        </button>
      </form>
    );
  }

  return (
    <form
      className="mt-5 grid gap-3"
      onSubmit={reimbursementForm.handleSubmit(async (values) => {
        await createReimbursement.mutateAsync({
          ...values,
          amountCents: Number(values.amountCents),
          reimbursedCents: Number(values.reimbursedCents),
          reimbursedOn: values.reimbursedOn || null,
        });
      })}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <select
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          {...reimbursementForm.register("personId")}
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          {...reimbursementForm.register("billId")}
        >
          <option value="">Linked bill</option>
          {billOptions
            .filter(
              (bill) => bill.personId === reimbursementForm.watch("personId"),
            )
            .map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.label}
              </option>
            ))}
        </select>
      </div>
      <input
        className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
        placeholder="Payer name"
        {...reimbursementForm.register("payerName")}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="number"
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          placeholder="Claim amount (cents)"
          {...reimbursementForm.register("amountCents", {
            valueAsNumber: true,
          })}
        />
        <input
          type="number"
          className="rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-3"
          placeholder="Reimbursed (cents)"
          {...reimbursementForm.register("reimbursedCents", {
            valueAsNumber: true,
          })}
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-[var(--plum)] px-4 py-2 text-sm font-medium text-white"
      >
        Save reimbursement
      </button>
    </form>
  );
}

export function AdminPage() {
  const { personScope } = usePersonScope();
  const { t } = useLocale();
  const prescriptionsQuery = useQuery({
    queryKey: ["prescriptions", personScope],
    queryFn: () => api.getPrescriptions(personScope),
  });
  const billsQuery = useQuery({
    queryKey: ["bills", personScope],
    queryFn: () => api.getBills(personScope),
  });
  const reimbursementsQuery = useQuery({
    queryKey: ["reimbursements", personScope],
    queryFn: () => api.getReimbursements(personScope),
  });

  const prescriptionColumns = useMemo(
    () => [
      { header: "Medication", accessorKey: "medicationName" },
      { header: "Dosage", accessorKey: "dosage" },
      { header: "Issued", accessorKey: "issuedOn" },
      { header: "Status", accessorKey: "status" },
    ],
    [],
  );
  const billColumns = useMemo(
    () => [
      { header: "Label", accessorKey: "label" },
      {
        header: "Amount",
        cell: ({
          row,
        }: { row: { original: { amountCents: number; currency: string } } }) =>
          `${row.original.amountCents / 100} ${row.original.currency}`,
      },
      { header: "Date", accessorKey: "incurredOn" },
      { header: "Status", accessorKey: "status" },
    ],
    [],
  );
  const reimbursementColumns = useMemo(
    () => [
      { header: "Payer", accessorKey: "payerName" },
      { header: "Submitted", accessorKey: "submittedOn" },
      {
        header: "Claim",
        cell: ({ row }: { row: { original: { amountCents: number } } }) =>
          `${row.original.amountCents / 100} EUR`,
      },
      { header: "Status", accessorKey: "status" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title={t("prescriptions")}
          value={prescriptionsQuery.data?.length ?? 0}
          accent="var(--teal)"
          detail="Unified medication workspace."
        />
        <MetricCard
          title={t("bills")}
          value={billsQuery.data?.length ?? 0}
          accent="var(--amber)"
          detail="Invoices and co-pay tracking."
        />
        <MetricCard
          title={t("reimbursements")}
          value={reimbursementsQuery.data?.length ?? 0}
          accent="var(--plum)"
          detail="Claims waiting for settlement."
        />
      </section>

      <TabGroup>
        <TabList className="glass-panel flex flex-wrap gap-2 rounded-[2rem] p-2">
          {[t("prescriptions"), t("bills"), t("reimbursements")].map(
            (label) => (
              <Tab
                key={label}
                className="rounded-full px-4 py-2 text-sm font-medium outline-none data-[selected]:bg-[rgba(15,118,110,0.12)] data-[selected]:text-[var(--teal)]"
              >
                {label}
              </Tab>
            ),
          )}
        </TabList>
        <TabPanels className="mt-6 space-y-6">
          <TabPanel className="glass-panel rounded-[2rem] p-6">
            <h2 className="page-title text-2xl">Prescriptions</h2>
            <QuickCreateForm type="prescription" personScope={personScope} />
            <div className="mt-6">
              <DataTable
                columns={prescriptionColumns}
                data={prescriptionsQuery.data ?? []}
              />
            </div>
          </TabPanel>
          <TabPanel className="glass-panel rounded-[2rem] p-6">
            <h2 className="page-title text-2xl">Bills</h2>
            <QuickCreateForm type="bill" personScope={personScope} />
            <div className="mt-6">
              <DataTable columns={billColumns} data={billsQuery.data ?? []} />
            </div>
          </TabPanel>
          <TabPanel className="glass-panel rounded-[2rem] p-6">
            <h2 className="page-title text-2xl">Reimbursements</h2>
            <QuickCreateForm type="reimbursement" personScope={personScope} />
            <div className="mt-6">
              <DataTable
                columns={reimbursementColumns}
                data={reimbursementsQuery.data ?? []}
              />
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
