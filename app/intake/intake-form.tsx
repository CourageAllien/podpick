'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { intakeSections, type IntakeField } from './questions';
import { submitIntake } from './actions';

const inputClasses =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-terracotta focus:ring-2 focus:ring-terracotta/20';

function Field({
  field,
  value,
  onChange,
}: {
  field: IntakeField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium text-stone-800">
        {field.label}
        {field.required && <span className="ml-1 text-terracotta">*</span>}
      </label>
      {field.help && <p className="mt-1 text-xs leading-relaxed text-stone-500">{field.help}</p>}

      {field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          value={value}
          required={field.required}
          rows={4}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${inputClasses} resize-y leading-relaxed`}
        />
      ) : field.type === 'select' ? (
        <select
          id={field.name}
          name={field.name}
          value={value}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${inputClasses} ${value ? '' : 'text-stone-400'}`}
        >
          <option value="">Select one…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="text-stone-900">
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type}
          value={value}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${inputClasses}`}
        />
      )}
    </div>
  );
}

export default function IntakeForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitIntake(values);
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error(result.error);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white/70 p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-terracotta">Received</p>
        <h2 className="mt-3 font-serif text-3xl text-stone-900">Thank you, we have it.</h2>
        <p className="mx-auto mt-4 max-w-md text-stone-600">
          Your booker is reviewing your answers now. You will hear from us by email with your draft
          media page and the first shows we recommend. If anything is missing, we will reach out.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {intakeSections.map((section, i) => (
        <section key={section.id}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-terracotta">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="font-serif text-2xl text-stone-900">{section.title}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{section.blurb}</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.name}
                className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
              >
                <Field field={field} value={values[field.name] ?? ''} onChange={(v) => set(field.name, v)} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-terracotta px-6 py-3 font-medium text-white transition hover:bg-terracotta-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Sending…' : 'Submit intake'}
        </button>
        <p className="mt-3 text-xs text-stone-500">
          Fields marked <span className="text-terracotta">*</span> are required. Everything else
          helps, but you can leave anything blank and we will follow up.
        </p>
      </div>
    </form>
  );
}
