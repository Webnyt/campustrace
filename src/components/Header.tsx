import React, { useState } from 'react';
import { Package, PlusCircle, Search, LogOut, ChevronDown, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenReport: (type?: 'found' | 'lost') => void;
  onExportCsv?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReport, onExportCsv }) => {
  const { user, profile, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const isAdmin = profile?.role === 'staff' || profile?.role === 'admin';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const authControl = (compact: boolean) =>
    user ? (
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-200 min-h-[44px]"
          title={user.displayName || 'Campus User'}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          {!compact && (
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight max-w-[90px] truncate">
                {user.displayName?.split(' ')[0] || 'User'}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">
                {isAdmin ? 'Staff' : 'Student'}
              </span>
            </div>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">
                  {user.displayName || 'Campus Student'}
                </p>
                <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isAdmin ? 'Campus Staff / Admin' : 'Campus Student'}
                </div>
              </div>

              {isAdmin && onExportCsv && (
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onExportCsv();
                  }}
                  className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition cursor-pointer border-b border-slate-100 min-h-[44px]"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Export Inventory (CSV)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  signOut();
                }}
                className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    ) : (
      <button
        onClick={handleSignIn}
        disabled={signingIn}
        className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50 min-h-[44px]"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{signingIn ? 'Connecting...' : compact ? 'Sign in' : 'Sign in with Google'}</span>
      </button>
    );

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:h-16 sm:py-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white p-2 rounded-xl shadow-sm flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-none truncate">
                CampusTrace
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium truncate">
                University Lost &amp; Found
              </p>
            </div>
          </div>
          <div className="sm:hidden shrink-0">{authControl(true)}</div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenReport('found')}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Report Found</span>
          </button>
          <button
            onClick={() => onOpenReport('lost')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 transition cursor-pointer min-h-[44px]"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>I Lost Something</span>
          </button>
          <div className="hidden sm:block">{authControl(false)}</div>
        </div>
      </div>

      {authError && (
        <div className="bg-amber-50 border-t border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-start justify-between gap-3">
          <span>{authError}</span>
          <button
            onClick={clearAuthError}
            className="text-amber-800 font-bold cursor-pointer shrink-0 min-h-[32px] px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
