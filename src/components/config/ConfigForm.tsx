import { type UseFormReturn, type SubmitHandler } from 'react-hook-form';

export interface ConfigFormProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  className?: string;
}

export function ConfigForm<T extends Record<string, unknown>>({
  form,
  onSubmit,
  children,
  className = '',
}: ConfigFormProps<T>) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={['space-y-4', className].filter(Boolean).join(' ')}
    >
      {children}
    </form>
  );
}
