import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAdmin } from '../admin-context';
import { createTreeFormSchema } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
export function CreateTreeForm() {
  const { setup, disabled, transaction, wallet } = useAdmin();
  const allowed =
    setup.data?.admins.includes(wallet) && setup.data.paymentTokenInitialized;
  const {
    register,
    handleSubmit,
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
  return (
    <Card title="Initialize a tree">
      <p className="mb-5 text-sm text-forest/75">
        Your wallet becomes the creator. Choose a unique tree ID for this
        wallet; amounts are in mockUSDC.
      </p>
      <p className="mb-5 text-sm text-forest/75">
        The supplier receives the funded purchase payment. The client pays
        energy invoices. The reporter signs production reports.
      </p>
      {!allowed && (
        <p className="mb-4 text-sm">
          Initialize the payment token and add your wallet to the chain admin
          list first.
        </p>
      )}
      <form
        onSubmit={handleSubmit((data) =>
          transaction.mutate({ action: 'initTree', ...data }),
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
            error={errors.reporter?.message}
          />
          <Button type="submit" className="justify-self-start">
            Initialize tree
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
