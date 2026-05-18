'use client';

import React, { useState } from 'react';
import { EngineerInput, FIELD_LABELS } from '@/types/engineer';

interface AddEngineerModalProps {
  onClose: () => void;
  onSaved: () => void;
}

type FormData = Omit<EngineerInput, 'rowIndex'>;

const NUMBER_FIELDS: (keyof FormData)[] = ['contractAmount', 'salary', 'cost'];

const EMPTY_FORM: FormData = {
  name: '',
  kana: '',
  dateOfBirth: '',
  employmentType: '',
  partnerName: '',
  customer: '',
  projectName: '',
  workContent: '',
  skills: '',
  estimatedEndDate: '',
  salesRep: '',
  participationDate: '',
  contractUnit: '',
  fixedTerm: '',
  projectContractPeriod: '',
  contractAmount: '',
  salary: '',
  cost: '',
  department: '',
  location: '',
  personInCharge: '',
  lending: '',
};

interface FieldGroup {
  label: string;
  fields: (keyof FormData)[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: '基本情報',
    fields: ['name', 'kana', 'dateOfBirth', 'employmentType', 'partnerName', 'department'],
  },
  {
    label: 'プロジェクト情報',
    fields: ['customer', 'projectName', 'workContent', 'skills', 'location', 'participationDate', 'estimatedEndDate'],
  },
  {
    label: '契約情報',
    fields: ['contractUnit', 'fixedTerm', 'projectContractPeriod', 'contractAmount', 'salary', 'cost'],
  },
  {
    label: '担当者情報',
    fields: ['salesRep', 'personInCharge', 'lending'],
  },
];

export default function AddEngineerModal({ onClose, onSaved }: AddEngineerModalProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = '氏名は必須です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    // Convert number fields
    const payload: FormData = { ...form };
    for (const field of NUMBER_FIELDS) {
      const val = payload[field];
      if (val !== '' && val !== undefined) {
        const num = parseFloat(String(val).replace(/[,¥]/g, ''));
        (payload as Record<string, unknown>)[field] = isNaN(num) ? val : num;
      }
    }

    try {
      const res = await fetch('/api/engineers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '追加に失敗しました');
        return;
      }
      onSaved();
    } catch {
      alert('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">エンジニアを追加</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {FIELD_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-1">
                  {group.label}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.fields.map((field) => {
                    const isNumber = NUMBER_FIELDS.includes(field);
                    const isLarge = field === 'workContent' || field === 'skills';
                    const rawVal = form[field];
                    const strVal = rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
                    const label = FIELD_LABELS[field as keyof typeof FIELD_LABELS] ?? field;
                    return (
                      <div key={field} className={isLarge ? 'col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}
                          {field === 'name' && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {isLarge ? (
                          <textarea
                            value={strVal}
                            onChange={(e) => handleChange(field, e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                        ) : (
                          <input
                            type={isNumber ? 'number' : 'text'}
                            value={strVal}
                            onChange={(e) => handleChange(field, e.target.value)}
                            placeholder={
                              field === 'dateOfBirth' || field === 'participationDate' || field === 'estimatedEndDate'
                                ? 'YYYY/MM/DD'
                                : ''
                            }
                            className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors[field] ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                        )}
                        {errors[field] && (
                          <p className="mt-1 text-xs text-red-500">{errors[field]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {saving ? '保存中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
