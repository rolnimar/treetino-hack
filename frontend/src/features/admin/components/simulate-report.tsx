import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { api, jsonBody } from '../../../lib/api';
import {
  mockReportResultSchema,
  reportSimulationSchema,
  type IndexedTree,
} from '../../../lib/schemas';
import { useAuth } from '../../auth/auth-context';
import { useAdmin } from '../admin-context';
import { simulateReportFormSchema } from '../schemas';
import { lastCompletedUtcDay } from '../../../chain/amounts';

export function SimulateReport({
  tree,
  backendReporter,
}: {
  tree: IndexedTree;
  backendReporter: boolean;
}) {
  const { session } = useAuth();
  const { wallet, disabled, transaction } = useAdmin();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(simulateReportFormSchema),
    defaultValues: { day: lastCompletedUtcDay() },
  });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const mutation = useMutation({
    mutationFn: async (day: string) => {
      if (!session) throw new Error('Admin login required');
      const current = new AbortController();
      controller.current = current;
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      if (backendReporter) {
        return api(
          `admin/trees/${tree.address}/simulate-report`,
          mockReportResultSchema,
          {
            ...jsonBody({ day }),
            headers: { ...headers, 'Content-Type': 'application/json' },
            signal: current.signal,
          },
        );
      }
      const simulation = await api(
        `admin/trees/${tree.address}/report-simulation?day=${encodeURIComponent(day)}`,
        reportSimulationSchema,
        {
          headers,
          signal: current.signal,
        },
      );
      if (
        simulation.tree !== tree.address ||
        simulation.reporter !== wallet ||
        simulation.dayStartTs !== String(Date.parse(day + 'T00:00:00Z') / 1000)
      )
        throw new Error(
          'Simulation does not match the selected tree, reporter, or UTC day',
        );
      if (simulation.alreadyReported)
        return {
          message: `A report for ${day} is already on chain. Load reports & invoices to view it.`,
          signature: null,
        };
      if (!simulation.ready)
        return {
          message: `The selected UTC day completes at ${new Date(simulation.readyAt).toLocaleString()}.`,
          signature: null,
        };
      current.signal.throwIfAborted();
      const signature = await transaction.mutateAsync({
        action: 'simulateReport',
        tree,
        dayStartTs: simulation.dayStartTs,
        wh: simulation.wh,
      });
      return {
        message:
          'Report confirmed. Production and invoices will update when the indexer picks it up.',
        signature,
      };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tree-reports'] }),
        queryClient.invalidateQueries({
          queryKey: ['mock-reporter-status', tree.address],
        }),
      ]);
    },
    retry: false,
  });
  const allowed = backendReporter
    ? tree.creator === wallet
    : tree.reporter === wallet;
  return (
    <form
      className="space-y-2"
      onSubmit={handleSubmit(({ day }) => mutation.mutate(day))}
    >
      <Field
        label="Report day (UTC)"
        type="date"
        min="1970-01-01"
        max={lastCompletedUtcDay()}
        {...register('day')}
        error={errors.day?.message}
        disabled={mutation.isPending}
      />
      <Button
        type="submit"
        disabled={
          disabled || mutation.isPending || !allowed || tree.phase !== 'active'
        }
      >
        {mutation.isPending ? 'Submitting report…' : 'Simulate report on chain'}
      </Button>
      <p className="text-xs text-forest/65">
        {tree.phase !== 'active'
          ? 'Activate this tree to start reporting.'
          : !allowed
            ? backendReporter
              ? 'Connect this tree’s creator wallet to simulate its backend reporter.'
              : 'Connect the configured reporter wallet to submit a report.'
            : 'Choose any completed UTC day. Reports can be submitted in any order, once per day.'}
      </p>
      <ErrorMessage error={mutation.error} />
      {mutation.data && (
        <p role="status" className="text-sm">
          {mutation.data.message}
        </p>
      )}
      {mutation.data?.signature && (
        <a
          className="block text-xs underline"
          href={`https://solscan.io/tx/${mutation.data.signature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
        >
          View report transaction ↗
        </a>
      )}
    </form>
  );
}
