import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { IndexedTree } from '../../../lib/schemas';
import { invoiceFormSchema, type ProductionReport } from '../schemas';
import { useAdmin } from '../admin-context';
import { Button } from '../../../components/ui/button';
import { Field, SelectField } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { formatTokenAmount, utcDay } from '../../../chain/amounts';
export function ReportsPanel({ tree }: { tree: IndexedTree }) {
  const [open, setOpen] = useState(false);
  const { client } = useAdmin();
  const query = useQuery({
    queryKey: ['admin', 'reports', tree.address],
    queryFn: () => client.reports(tree.address),
    enabled: open,
  });
  const uninvoiced =
    query.data?.filter((report) => !report.invoiceIssued) ?? [];
  return (
    <div className="space-y-4 border-t border-forest/15 pt-4">
      <Button
        variant="secondary"
        disabled={query.isFetching}
        onClick={() => {
          setOpen(true);
          if (open) void query.refetch();
        }}
      >
        Load reports & invoices
      </Button>
      <ErrorMessage error={query.error} />
      {query.isFetching && <p className="text-sm">Loading reports…</p>}
      {query.data && (
        <>
          <p className="text-sm">{query.data.length} production reports</p>
          <div className="max-h-60 space-y-2 overflow-auto text-sm">
            {query.data.map((report) => (
              <p key={report.address}>
                {utcDay(report.dayStartTs)} · {report.totalWh} Wh ·{' '}
                {report.invoiceIssued
                  ? `${formatTokenAmount(report.due)} due / ${formatTokenAmount(report.paid)} paid`
                  : 'Not invoiced'}
              </p>
            ))}
          </div>
          {uninvoiced.length > 0 && (
            <InvoiceForm
              key={uninvoiced.map((report) => report.address).join(',')}
              tree={tree}
              reports={uninvoiced}
            />
          )}
        </>
      )}
    </div>
  );
}
function InvoiceForm({
  tree,
  reports,
}: {
  tree: IndexedTree;
  reports: ProductionReport[];
}) {
  const { disabled, wallet, transaction } = useAdmin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    z.input<typeof invoiceFormSchema>,
    unknown,
    z.output<typeof invoiceFormSchema>
  >({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: { report: reports[0]?.address ?? '', amount: '' },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        const report = reports.find((report) => report.address === data.report);
        if (report)
          transaction.mutate({
            action: 'issueInvoice',
            tree,
            report,
            amount: data.amount,
          });
      })}
    >
      <fieldset
        disabled={disabled || tree.creator !== wallet}
        className="max-w-md space-y-4 disabled:opacity-60"
      >
        <SelectField
          label="Report"
          {...register('report')}
          error={errors.report?.message}
        >
          {reports.map((report) => (
            <option key={report.address} value={report.address}>
              {utcDay(report.dayStartTs)} · {report.totalWh} Wh
            </option>
          ))}
        </SelectField>
        <Field
          label="Final invoice amount (mockUSDC)"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <p className="text-xs text-forest/70">
          The final amount cannot be changed once issued. Zero is allowed.
        </p>
        <Button type="submit">Issue invoice</Button>
      </fieldset>
    </form>
  );
}
