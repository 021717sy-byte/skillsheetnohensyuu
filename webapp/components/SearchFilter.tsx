'use client';

import React from 'react';
import { Engineer } from '@/types/engineer';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterEmploymentType: string;
  onFilterEmploymentTypeChange: (value: string) => void;
  filterDepartment: string;
  onFilterDepartmentChange: (value: string) => void;
  filterSalesRep: string;
  onFilterSalesRepChange: (value: string) => void;
  engineers: Engineer[];
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  filterEmploymentType,
  onFilterEmploymentTypeChange,
  filterDepartment,
  onFilterDepartmentChange,
  filterSalesRep,
  onFilterSalesRepChange,
  engineers,
}: SearchFilterProps) {
  const employmentTypes = Array.from(new Set(engineers.map((e) => e.employmentType).filter(Boolean))).sort();
  const departments = Array.from(new Set(engineers.map((e) => e.department).filter(Boolean))).sort();
  const salesReps = Array.from(new Set(engineers.map((e) => e.salesRep).filter(Boolean))).sort();

  return (
    <div className="flex flex-wrap gap-3 items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 flex-1 min-w-48">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="キーワード検索..."
          className="w-full text-sm border-0 outline-none text-gray-700 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-gray-300 hidden sm:block" />

      <select
        value={filterEmploymentType}
        onChange={(e) => onFilterEmploymentTypeChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">雇用形態: 全て</option>
        {employmentTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        value={filterDepartment}
        onChange={(e) => onFilterDepartmentChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">部署: 全て</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={filterSalesRep}
        onChange={(e) => onFilterSalesRepChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">営業担当: 全て</option>
        {salesReps.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {(searchQuery || filterEmploymentType || filterDepartment || filterSalesRep) && (
        <button
          onClick={() => {
            onSearchChange('');
            onFilterEmploymentTypeChange('');
            onFilterDepartmentChange('');
            onFilterSalesRepChange('');
          }}
          className="text-xs text-red-500 hover:text-red-700 underline whitespace-nowrap"
        >
          フィルターをクリア
        </button>
      )}
    </div>
  );
}
