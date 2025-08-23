import React from 'react';
import { Page, Section } from '../../ui';
import { useAsyncOperation } from '../../hooks';

interface GeneratorContainerProps<TData, TFormData> {
  title: string;
  description: string;
  loadingMessage: string;
  FormComponent: React.ComponentType<{
    onGenerate: (formData: TFormData) => void;
  }>;
  SheetComponent: React.ComponentType<{
    data?: TData | null;
    [key: string]: any;
  }>;
  generateFunction: (formData: TFormData) => Promise<TData>;
  sheetProps?: Record<string, any>;
}

export function GeneratorContainer<TData = any, TFormData = any>({
  title,
  description,
  loadingMessage,
  FormComponent,
  SheetComponent,
  generateFunction,
  sheetProps = {}
}: GeneratorContainerProps<TData, TFormData>) {
  const { data, loading, error, execute } = useAsyncOperation<TData>();

  const handleGenerate = async (formData: TFormData) => {
    await execute(() => generateFunction(formData));
  };

  return (
    <Page>
      <Section title={title} className="py-8">
        <p className="text-lg mb-8 max-w-3xl mx-auto">
          {description}
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div>
            <FormComponent onGenerate={handleGenerate} />

            {loading && (
              <div className="mt-4 text-center text-indigo-300">
                <p>{loadingMessage}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 text-center text-red-400">
                <p>{error}</p>
              </div>
            )}
          </div>

          <SheetComponent data={data} {...sheetProps} />
        </div>
      </Section>
    </Page>
  );
}