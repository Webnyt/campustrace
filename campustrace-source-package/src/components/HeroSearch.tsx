import React from 'react';
import { Search, X, Sparkles, MapPin, AlertCircle } from 'lucide-react';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  onSelectSuggestion: (tag: string) => void;
  totalMatches: number;
  totalItems: number;
}

const POPULAR_SEARCH_TAGS = [
  'Calculator',
  'Student ID',
  'AirPods',
  'Notebook',
  'Keys',
  'Water Bottle',
  'Library',
  'Cafeteria',
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSelectSuggestion,
  totalMatches,
  totalItems,
}) => {
  return (
    <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50 shadow-inner">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        {/* Campus announcement pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-800/60 border border-indigo-700/50 text-indigo-200 text-xs backdrop-blur-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-time University Campus Item Recovery System</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Did you lose or find something on campus?
        </h2>

        <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Search through active items reported across campus halls, lecture complexes, and libraries,
          or submit a report to return or recover belongings safely.
        </p>

        {/* Live Search Bar */}
        <div className="pt-3 max-w-2xl mx-auto relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by item name, hall, library, description, or finder contact..."
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-slate-900 bg-white placeholder-slate-400 shadow-xl focus:outline-none focus:ring-3 focus:ring-indigo-400 text-sm font-medium transition"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                aria-label="Clear search"
                className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Result Feedback */}
          {searchQuery && (
            <div className="mt-2 text-xs text-indigo-200 flex items-center justify-between px-2">
              <span>
                Found <strong className="text-white">{totalMatches}</strong> matching {totalMatches === 1 ? 'item' : 'items'} for "{searchQuery}"
              </span>
              <button
                onClick={onClearSearch}
                className="text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Reset search
              </button>
            </div>
          )}

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs">
            <span className="text-indigo-300/80 mr-1 text-[11px] font-medium">Quick keywords:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectSuggestion(tag)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-xs'
                    : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/60 hover:bg-indigo-800/80 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
