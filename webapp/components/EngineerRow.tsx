'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Engineer, EngineerInput, COMPUTED_READONLY } from '@/types/engineer';

interface EngineerRowProps {
  engineer: Engineer;
  visibleColumns: (keyof Engineer)[];
  formatCellValue: (col: keyof Engineer, value: Engineer[keyof Engineer]) => string;
  getCellClass: (col: keyof Engineer, value: Engineer[keyof Engineer]) => string;
  onRefresh: () => void;
}

const NUMBER_FIELDS: (keyof Engineer)[] = ['contractAmount', 'salary', 'cost'];

export default function EngineerRow({
  engineer,
  visibleColumns,
  formatCellValue,
  getCellClass,
  onRefresh,
}: EngineerRowProps) {
  const [editingCol, setEditingCol] = useState<keyof Engineer | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowData, setRowData] = useState<Engineer>(engineer);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when engineer prop changes
  useEffect(() => {
    setRowData(engineer);
  }, [engineer]);

  useEffect(() => {
    if (editingCol && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCol]);

  function startEdit(col: keyof Engineer) {
    if (COMPUTED_READONLY.includes(col)) return;
    const raw = rowData[col];
    // For money fields show number without formatting
    if (NUMBER_FIELDS.includes(col) && typeof raw === 'number') {
      setEditValue(String(raw));
    } else {
      setEditValue(raw !== null && raw !== undefined ? String(raw) : '');
    }
    setEditingCol(col);
  }

  function cancelEdit() {
    setEditingCol(null);
    setEditValue('');
  }

  async function saveEdit() {
    if (!editingCol) return;
    setSaving(true);

    // Build payload from current rowData
    const payload: EngineerInput = {
      rowIndex: rowData.rowIndex,
      name: rowData.name,
      kana: rowData.kana,
      dateOfBirth: rowData.dateOfBirth,
      employmentType: rowData.employmentType,
      partnerName: rowData.partnerName,
      customer: rowData.customer,
      projectName: rowData.projectName,
      workContent: rowData.workContent,
      skills: rowData.skills,
      estimatedEndDate: rowData.estimatedEndDate,
      salesRep: rowData.salesRep,
      participationDate: rowData.participationDate,
      contractUnit: rowData.contractUnit,
      fixedTerm: rowData.fixedTerm,
      projectContractPeriod: rowData.projectContractPeriod,
      contractAmount: rowData.contractAmount,
      salary: rowData.salary,
      cost: rowData.cost,
      department: rowData.department,
      location: rowData.location,
      personInCharge: rowData.personInCharge,
      lending: rowData.lending,
    };

    // Apply the edit
    const newValue = NUMBER_FIELDS.includes(editingCol)
      ? (editValue === '' ? '' : parseFloat(editValue) || editValue)
      : editValue;

    (payload as Record<string, unknown>)[editingCol as string] = newValue;

    try {
      const res = await fetch(`/api/engineers/${rowData.rowIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '更新に失敗しました');
        return;
      }
      // Optimistically update local state
      setRowData((prev) => ({ ...prev, [editingCol]: newValue } as Engineer));
      setEditingCol(null);
      setEditValue('');
      // Refresh to recompute derived fields
      onRefresh();
    } catch {
      alert('通信エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`「${rowData.name || '(名前なし)'}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/engineers/${rowData.rowIndex}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '削除に失敗しました');
        return;
      }
      onRefresh();
    } catch {
      alert('通信エラーが発生しました');
    } finally {
      setDeleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }

  const isFirstCol = (col: keyof Engineer) => visibleColumns[0] === col;

  return (
    <tr className={`group hover:bg-blue-50 transition-colors ${deleting ? 'opacity-50' : ''}`}>
      {visibleColumns.map((col) => {
        const value = rowData[col];
        const isEditing = editingCol === col;
        const isReadonly = COMPUTED_READONLY.includes(col);
        const formatted = formatCellValue(col, value);
        const extraClass = getCellClass(col, value);

        return (
          <td
            key={col}
            className={`
              border border-gray-200 px-2 py-1.5 whitespace-nowrap max-w-48 overflow-hidden text-ellipsis
              ${isFirstCol(col) ? 'sticky left-0 z-10 bg-white group-hover:bg-blue-50' : ''}
              ${isReadonly ? 'bg-gray-50 group-hover:bg-blue-50' : 'cursor-pointer hover:bg-yellow-50'}
              ${extraClass}
            `}
            title={isEditing ? undefined : formatted}
            onClick={() => !isEditing && !isReadonly && startEdit(col)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type={NUMBER_FIELDS.includes(col) ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                disabled={saving}
                className="w-full min-w-24 border border-blue-400 rounded px-1 py-0.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            ) : (
              <span className={`text-sm ${!formatted ? 'text-gray-300 italic' : ''}`}>
                {formatted || '—'}
              </span>
            )}
          </td>
        );
      })}
      {/* Actions */}
      <td className="border border-gray-200 px-2 py-1.5 text-center whitespace-nowrap">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1 text-red-500 hover:text-white hover:bg-red-500 border border-red-300 hover:border-red-500 rounded transition-colors disabled:opacity-50"
        >
          {deleting ? '削除中...' : '削除'}
        </button>
      </td>
    </tr>
  );
}
