import React from 'react';
import { Category } from '../types';
import {
  Laptop,
  CreditCard,
  BookOpen,
  Heart,
  Key,
  Shirt,
  Sparkles,
  LayoutGrid,
  List,
  Filter,
  Download,
  Bell,
} from 'lucide-react';

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  statusFilter: 'All' | 'Unclaimed' | 'Claimed';
  onSelectStatus: (status: 'All' | 'Unclaimed' | 'Claimed') => void;
  typeFilter: 'All' | 'found' | 'lost';
  onSelectType: (type: 'All' | 'found' | 'lost') => void;
  sortBy: 'newest' | 'oldest' | 'name';
  onSelectSort: (sort: 'newest' | 'oldest' | 'name') => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  categoryCounts: Record<string, number>;
  totalVisible: number;
  onExportCsv: () => void;
  onOpenEmailAlerts?: (categoryName?: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5" />,
  Electronics: <Laptop className="w-3.5 h-3.5" />,
  'IDs & Cards': <CreditCard className="w-3.5 h-3.5" />,
  'Books & Notes': <BookOpen className="w-3.5 h-3.5" />,
  'Personal Items': <Heart className="w-3.5 h-3.5" />,
  'Keys & Wallets': <Key className="w-3.5 h-3.5" />,
  'Clothing & Bags': <Shirt className="w-3.5 h-3.5" />,
};

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatus,
  typeFilter,
  onSelectType,
  sortBy,
  onSelectSort,
  viewMode,
  onToggleViewMode,
  categoryCounts,
  totalVisible,
  onExportCsv,
  onOpenEmailAlerts,
}) => {
  const allCategoryNames = ['All', ...categories.map((c) => c.category_name)];

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Status Tabs & View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Status buttons */}
          <div className="inline-flex rounded-xl p-1 bg-slate-200/70 text-xs font-semibold">
            <button
              onClick={() => onSelectStatus('All')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => onSelectStatus('Unclaimed')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'Unclaimed'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Unclaimed (Active)</span>
            </button>
            <button
              onClick={() => onSelectStatus('Claimed')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === 'Claimed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Claimed (Returned)</span>
            </button>
          </div>

          {/* Type Filter */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 text-xs font-medium border border-slate-200/80">
            <button
              onClick={() => onSelectType('All')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'All' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => onSelectType('found')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'found' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Found Items
            </button>
            <button
              onClick={() => onSelectType('lost')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                typeFilter === 'lost' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'
              }`}
            >
              Lost Reports
            </button>
          </div>
        </div>

        {/* Right side: Sort, Download CSV, and View Mode */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 self-end sm:self-auto text-xs">
          {/* Download CSV button */}
          <button
            onClick={onExportCsv}
            disabled={totalVisible === 0}
            title={
              totalVisible === 0
                ? 'No items to export'
                : `Download ${totalVisible} filtered items as CSV spreadsheet`
            }
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Download CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {/* Quick Email Alert Button for filtered category */}
          {onOpenEmailAlerts && (
            <button
              onClick={() => onOpenEmailAlerts(selectedCategory !== 'All' ? selectedCategory : undefined)}
              title={`Create email alert for ${selectedCategory !== 'All' ? selectedCategory : 'all new items'}`}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alert Me</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="font-medium hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSelectSort(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            <button
              onClick={() => onToggleViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              title="List View"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Bar (Matching PHP Category Buttons) */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center space-x-2">
            <span>Active Campus Feed</span>
            <span
              id="itemCountBadge"
              className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-semibold"
            >
              {totalVisible}
            </span>
          </h3>
        </div>

        {/* Category buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {allCategoryNames.map((catName) => {
            const isSelected = selectedCategory === catName;
            const count = categoryCounts[catName] ?? 0;
            const icon = CATEGORY_ICONS[catName] || <Filter className="w-3.5 h-3.5" />;

            return (
              <button
                key={catName}
                onClick={() => onSelectCategory(catName)}
                className={`category-btn px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'active bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-100/90 border border-slate-200'
                }`}
              >
                <span>{icon}</span>
                <span>{catName}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected
                        ? 'bg-indigo-700 text-indigo-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
