'use client';

import { useState, useEffect, useCallback } from 'react';
import { Engineer } from '@/types/engineer';
import EngineerTable from '@/components/EngineerTable';
import SearchFilter from '@/components/SearchFilter';
import AddEngineerModal from '@/components/AddEngineerModal';

export default function Home() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSalesRep, setFilterSalesRep] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchEngineers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/engineers');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'データの取得に失敗しました');
      }
      const data = await res.json();
      setEngineers(data.engineers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  const filteredEngineers = engineers.filter((eng) => {
    if (filterEmploymentType && eng.employmentType !== filterEmploymentType) return false;
    if (filterDepartment && eng.department !== filterDepartment) return false;
    if (filterSalesRep && eng.salesRep !== filterSalesRep) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const fields = [
        eng.name, eng.kana, eng.employmentType, eng.partnerName,
        eng.customer, eng.projectName, eng.workContent, eng.skills,
        eng.salesRep, eng.department, eng.location, eng.personInCharge,
        eng.lending, eng.contractUnit, eng.projectContractPeriod,
      ];
      if (!fields.some((f) => f?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">エンジニア管理システム</h1>
            <p className="text-xs text-gray-500">
              {loading ? '読み込み中...' : `${filteredEngineers.length}件 / 合計${engineers.length}件`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEngineers}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            更新
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            エンジニアを追加
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterEmploymentType={filterEmploymentType}
          onFilterEmploymentTypeChange={setFilterEmploymentType}
          filterDepartment={filterDepartment}
          onFilterDepartmentChange={setFilterDepartment}
          filterSalesRep={filterSalesRep}
          onFilterSalesRepChange={setFilterSalesRep}
          engineers={engineers}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
              <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-700 font-medium mb-1">エラーが発生しました</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchEngineers}
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        ) : (
          <EngineerTable
            engineers={filteredEngineers}
            loading={loading}
            onRefresh={fetchEngineers}
          />
        )}
      </main>

      {/* Add modal */}
      {showAddModal && (
        <AddEngineerModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchEngineers();
          }}
        />
      )}
    </div>
  );
}
