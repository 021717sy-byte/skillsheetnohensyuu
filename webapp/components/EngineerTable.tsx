'use client';

import React, { useState, useMemo } from 'react';
import { Engineer, FIELD_LABELS, COLUMN_ORDER } from '@/types/engineer';
import EngineerRow from '@/components/EngineerRow';

interface EngineerTableProps {
  engineers: Engineer[];
  loading: boolean;
  onRefresh: () => void;
}

type SortConfig = {
  key: keyof Engineer;
  direction: 'asc' | 'desc';
} | null;

const MONEY_FIELDS: (keyof Engineer)[] = ['contractAmount', 'salary', 'cost', 'grossProfit16', 'grossProfit10', 'grossProfit30'];
const COMPUTED_READONLY: (keyof Engineer)[] = ['age', 'generation', 'grossProfit16', 'grossProfit10', 'grossProfit30'];

// Default hidden columns (to keep the table manageable)
const DEFAULT_HIDDEN: (keyof Engineer)[] = ['workContent', 'fixedTerm', 'projectContractPeriod', 'personInCharge'];

export default function EngineerTable({ engineers, loading, onRefresh }: EngineerTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<keyof Engineer>>(new Set(DEFAULT_HIDDEN));
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  const visibleColumns = COLUMN_ORDER.filter((col) => !hiddenColumns.has(col));

  const sortedEngineers = useMemo(() => {
    if (!sortConfig) return engineers;
    return [...engineers].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined || aVal === '') return 1;
      if (bVal === null || bVal === undefined || bVal === '') return -1;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'ja');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [engineers, sortConfig]);

  function handleSort(key: keyof Engineer) {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }

  function toggleColumn(col: keyof Engineer) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  function formatCellValue(col: keyof Engineer, value: Engineer[keyof Engineer]): string {
    if (value === null || value === undefined || value === '') return '';
    if (MONEY_FIELDS.includes(col) && typeof value === 'number') {
      return `¥${value.toLocaleString('ja-JP')}`;
    }
    return String(value);
  }

  function getCellClass(col: keyof Engineer, value: Engineer[keyof Engineer]): string {
    if (['grossProfit16', 'grossProfit10', 'grossProfit30'].includes(col) && typeof value === 'number') {
      if (value < 0) return 'text-red-600 font-medium';
      if (value > 0) return 'text-green-600 font-medium';
    }
    return '';
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <span className="text-sm text-gray-500">
          {loading ? '読み込み中...' : `${engineers.length}件`}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowColumnToggle((v) => !v)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            列の表示/非表示
          </button>
          {showColumnToggle && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowColumnToggle(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 w-56 max-h-80 overflow-y-auto">
                <p className="text-xs font-medium text-gray-500 mb-2">列の表示設定</p>
                {COLUMN_ORDER.map((col) => (
                  <label key={col} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="w-3.5 h-3.5 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{FIELD_LABELS[col]}</span>
                    {COMPUTED_READONLY.includes(col) && (
                      <span className="text-xs text-gray-400 ml-auto">算出</span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && engineers.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">データを読み込んでいます...</span>
            </div>
          </div>
        ) : engineers.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">データが見つかりません</span>
            </div>
          </div>
        ) : (
          <table className="border-collapse text-sm min-w-max">
            <thead>
              <tr className="bg-gray-100 sticky top-0 z-10">
                {/* Frozen first column header */}
                {visibleColumns.length > 0 && (
                  <th
                    key={visibleColumns[0]}
                    className="sticky left-0 z-20 bg-gray-100 border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 select-none min-w-32"
                    onClick={() => handleSort(visibleColumns[0])}
                  >
                    <div className="flex items-center gap-1">
                      {FIELD_LABELS[visibleColumns[0]]}
                      {sortConfig?.key === visibleColumns[0] ? (
                        <span className="text-blue-500">{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      ) : (
                        <span className="text-gray-300"> ↕</span>
                      )}
                    </div>
                  </th>
                )}
                {visibleColumns.slice(1).map((col) => (
                  <th
                    key={col}
                    className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 select-none min-w-28"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1">
                      {FIELD_LABELS[col]}
                      {COMPUTED_READONLY.includes(col) && (
                        <span className="text-xs text-gray-400 font-normal">*</span>
                      )}
                      {sortConfig?.key === col ? (
                        <span className="text-blue-500">{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      ) : (
                        <span className="text-gray-300"> ↕</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEngineers.map((engineer) => (
                <EngineerRow
                  key={engineer.rowIndex}
                  engineer={engineer}
                  visibleColumns={visibleColumns}
                  formatCellValue={formatCellValue}
                  getCellClass={getCellClass}
                  onRefresh={onRefresh}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
