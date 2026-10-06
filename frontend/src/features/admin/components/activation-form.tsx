import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { IndexedTree } from '../../../lib/schemas';
import { activationFormSchema } from '../schemas';
import { useAdmin } from '../admin-context';
import { lastCompletedUtcDay } from '../../../chain/amounts';
import { Field } from '../../../components/ui/field';
import { Button } from '../../../components/ui/button';
export function ActivationForm({ tree }: { tree: IndexedTree }) {
  const { transaction, disabled, wallet } = useAdmin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activationFormSchema),
    defaultValues: { firstDay: lastCompletedUtcDay() },
  });
  return (
    <form
      onSubmit={handleSubmit((data) =>
        transaction.mutate({
          action: 'activateTree',
          tree,
          firstDay: data.firstDay,
        }),
      )}
    >
      <fieldset
        disabled={disabled || tree.creator !== wallet}
        className="max-w-sm space-y-4 disabled:opacity-60"
      >
        <Field
          label="First billing day (UTC)"
          type="date"
          min="1970-01-01"
          {...register('firstDay')}
          error={errors.firstDay?.message}
        />
        <p className="text-xs text-forest/65">
          Choose a past day to start automatic reporting from history, or a
          future day to schedule it.
        </p>
        <Button type="submit">Activate tree</Button>
      </fieldset>
    </form>
  );
}
