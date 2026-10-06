import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAdmin } from '../admin-context';
import { createTreeFormSchema } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { usePrepareMockReporter } from '../hooks/use-mock-reporter';
export function CreateTreeForm() {
  const { setup, disabled, transaction, wallet } = useAdmin();
  const allowed =
    setup.data?.admins.includes(wallet) && setup.data.paymentTokenInitialized;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<
    z.input<typeof createTreeFormSchema>,
    unknown,
    z.output<typeof createTreeFormSchema>
  >({
    resolver: zodResolver(createTreeFormSchema),
    defaultValues: {
      treeId: '1',
      target: '20000',
      supplier: '',
      client: '',
      reporter: '',
    },
  });
  const reporter = usePrepareMockReporter(
    useWatch({ control, name: 'treeId' }),
    !!allowed,
  );
  useEffect(() => {
    setValue('reporter', reporter.data?.wallet ?? '');
  }, [reporter.data?.wallet, setValue]);
  return (
    <Card title="Initialize a tree">
      <p className="mb-5 text-sm text-forest/75">
        Your wallet becomes the creator. Choose a unique tree ID for this
        wallet; amounts are in mockUSDC.
      </p>
      <p className="mb-5 text-sm text-forest/75">
        The supplier receives the funded purchase payment. The client pays
        energy invoices. A mock reporter wallet is generated and saved by the
        backend. Initialization funds it with 0.05 devnet SOL for report rent
        and fees.
      </p>
      {!allowed && (
        <p className="mb-4 text-sm">
          Initialize the payment token and add your wallet to the chain admin
          list first.
        </p>
      )}
      <ErrorMessage error={reporter.error} />
      {reporter.isFetching && (
        <p className="mb-4 text-sm">Preparing the tree’s reporter wallet…</p>
      )}
      <form
        onSubmit={handleSubmit((data) =>
          transaction.mutate({
            action: 'initTree',
            ...data,
            reporterFundingLamports: '50000000',
          }),
        )}
      >
        <fieldset
          disabled={disabled || !allowed}
          className="grid gap-4 sm:grid-cols-2 disabled:opacity-60"
        >
          <Field
            label="Tree ID (unique for your wallet)"
            {...register('treeId')}
            error={errors.treeId?.message}
          />
          <Field
            label="Funding target (mockUSDC)"
            {...register('target')}
            error={errors.target?.message}
          />
          <Field
            label="Supplier wallet"
            {...register('supplier')}
            error={errors.supplier?.message}
          />
          <Field
            label="Client wallet"
            {...register('client')}
            error={errors.client?.message}
          />
          <Field
            label="Device / reporter wallet"
            {...register('reporter')}
            readOnly
            error={errors.reporter?.message}
          />
          <Button
            type="submit"
            disabled={!reporter.data || reporter.isFetching}
            className="justify-self-start"
          >
            Initialize tree
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
