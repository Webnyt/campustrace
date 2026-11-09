/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LostFoundItem, Category, StatsData, EmailAlertSubscription } from './types';

import { CAMPUS_CATEGORIES } from './data/mockData';
import {
  fetchCategories,
  fetchItems,
  fetchStats,
  resetDemoData,
  unclaimItem,
} from './services/api';
import {
  subscribeToFirestoreItems,
  unclaimFirestoreLostFoundItem,
} from './firebase/firestoreService';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { FilterBar } from './components/FilterBar';
import { ItemCard } from './components/ItemCard';
import { ItemTableView } from './components/ItemTableView';
import { ReportModal } from './components/ReportModal';
import { ClaimModal } from './components/ClaimModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { PrintNoticeModal } from './components/PrintNoticeModal';
import { StatsModal } from './components/StatsModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { PushAlertToast } from './components/PushAlertToast';
import { exportItemsToCsv } from './utils/csvExport';
import { fetchEmailAlerts } from './services/emailAlertService';
import {
  sendBrowserPushNotification,
  checkItemMatchesSavedAlerts,
} from './services/notificationService';
import { initOneSignal } from './services/oneSignalService';
import { WelcomingScreen } from './components/WelcomingScreen';

import {
  FolderOpen,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Cloud,
  Bell,
} from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState<Category[]>(CAMPUS_CATEGORIES);

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unclaimed' | 'Claimed'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'found' | 'lost'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState<'found' | 'lost'>('found');
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [targetClaimItem, setTargetClaimItem] = useState<LostFoundItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [targetDetailItem, setTargetDetailItem] = useState<LostFoundItem | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [targetPrintItem, setTargetPrintItem] = useState<LostFoundItem | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);

  // Email Alerts & Real-Time Push Notifications System
  const [isEmailAlertsOpen, setIsEmailAlertsOpen] = useState(false);
  const [alertKeywordPrefill, setAlertKeywordPrefill] = useState('');
  const [alertCategoryPrefill, setAlertCategoryPrefill] = useState('All');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [savedAlerts, setSavedAlerts] = useState<EmailAlertSubscription[]>([]);
  const [activePushAlert, setActivePushAlert] = useState<{
    item: LostFoundItem;
    matchReason: string;
  } | null>(null);

  const savedAlertsRef = useRef<EmailAlertSubscription[]>([]);
  savedAlertsRef.current = savedAlerts;
  const knownItemIdsRef = useRef<Set<string | number>>(new Set());
  const isInitialLoadRef = useRef(true);

  const handleOpenEmailAlerts = useCallback((keyword?: string, categoryName?: string) => {
    setAlertKeywordPrefill(keyword || '');
    setAlertCategoryPrefill(categoryName || 'All');
    setIsEmailAlertsOpen(true);
  }, []);

  // Welcoming Screen (5-second splash with smooth fade into main app page)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [mainPageFadedIn, setMainPageFadedIn] = useState(false);

  // Smoothly begin fading in main app page as the 5-second welcoming timer elapses
  useEffect(() => {
    if (!showWelcomeScreen) {
      setMainPageFadedIn(true);
      return;
    }
    const timer = setTimeout(() => {
      setMainPageFadedIn(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [showWelcomeScreen]);

  const handleWelcomeComplete = useCallback(() => {
    setMainPageFadedIn(true);
    setShowWelcomeScreen(false);
  }, []);

  // Toast / Status banner (matching PHP $message & $msgType)

  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // Initial load and real-time Firestore sync with Push Notification detection
  useEffect(() => {
    setLoading(true);

    // Initialize OneSignal Web Push (for closed-tab background alerts)
    initOneSignal().catch((err) => {
      console.warn('OneSignal init notice:', err);
    });

    fetchCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
    fetchStats().then((stats) => {
      if (stats) setStatsData(stats);
    });
    fetchEmailAlerts().then((alerts) => {
      if (alerts && alerts.length > 0) {
        setSavedAlerts(alerts);
        setActiveAlertsCount(alerts.filter((a) => a.active).length);
      }
    });

    // Real-time synchronization with Cloud Firestore
    const unsubscribe = subscribeToFirestoreItems(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          // If this is after the initial load, detect and alert on newly added items
          if (!isInitialLoadRef.current) {
            const newArrivals = firestoreItems.filter(
              (item) => !knownItemIdsRef.current.has(item.item_id)
            );

            for (const newItem of newArrivals) {
              knownItemIdsRef.current.add(newItem.item_id);
              const matchResult = checkItemMatchesSavedAlerts(
                newItem,
                savedAlertsRef.current
              );
              if (matchResult.isMatch) {
                // Fire native browser push notification
                sendBrowserPushNotification({
                  title: `[CampusTrace Alert] Match Found: ${newItem.item_name}`,
                  body: `Turned in at ${newItem.location_found}. Drop-off desk: ${
                    newItem.dropoff_location || 'Campus Desk'
                  }. Tap to view.`,
                  item: newItem,
                  matchReason: matchResult.reason,
                  onClick: () => {
                    setTargetDetailItem(newItem);
                    setIsDetailOpen(true);
                  },
                });

                // Display real-time in-app push alert banner
                setActivePushAlert({
                  item: newItem,
                  matchReason: matchResult.reason,
                });
              }
            }
          } else {
            // Seed existing items on initial mount
            firestoreItems.forEach((i) => knownItemIdsRef.current.add(i.item_id));
            isInitialLoadRef.current = false;
          }

          setItems(firestoreItems);
        }
        setLoading(false);
      },
      async (err) => {
        console.warn('Firestore subscription fallback to REST:', err);
        const fallbackItems = await fetchItems();
        setItems(fallbackItems);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch {
          // ignore cleanup errors on unmount
        }
      }
    };
  }, []);


  // Filtered & Sorted items calculation
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return items
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'All' && item.category_name.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'All' && item.item_status !== statusFilter) {
          return false;
        }

        // Type filter (lost vs found)
        if (typeFilter !== 'All' && item.item_type !== typeFilter) {
          return false;
        }

        // Search query
        if (q) {
          const hay = `${item.item_name} ${item.location_found} ${item.description} ${item.finder_name || ''} ${item.finder_contact} ${item.dropoff_location || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.date_posted).getTime() - new Date(b.date_posted).getTime();
        }
        if (sortBy === 'name') {
          return a.item_name.localeCompare(b.item_name);
        }
        return 0;
      });
  }, [items, searchQuery, selectedCategory, statusFilter, typeFilter, sortBy]);

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    categories.forEach((cat) => {
      counts[cat.category_name] = items.filter(
        (i) => i.category_name.toLowerCase() === cat.category_name.toLowerCase()
      ).length;
    });
    return counts;
  }, [items, categories]);

  const unclaimedCount = useMemo(
    () => items.filter((i) => i.item_status === 'Unclaimed').length,
    [items]
  );

  // Handlers
  const handleOpenReport = (type: 'found' | 'lost' = 'found') => {
    setReportType(type);
    setIsReportOpen(true);
  };

  const handleItemAdded = (newItem: LostFoundItem) => {
    knownItemIdsRef.current.add(newItem.item_id);
    setItems((prev) => [newItem, ...prev]);
    showToast(
      newItem.item_type === 'found'
        ? `"${newItem.item_name}" successfully posted to CampusTrace!`
        : `Lost report for "${newItem.item_name}" registered! Campus community will be notified.`
    );
  };

  const handleOpenClaim = (item: LostFoundItem) => {
    setTargetClaimItem(item);
    setIsClaimOpen(true);
  };

  const handleClaimSuccess = (updatedItem: LostFoundItem) => {
    // Dynamic real-time update
    setItems((prev) =>
      prev.map((item) => (item.item_id === updatedItem.item_id ? updatedItem : item))
    );
    showToast(`Item #${updatedItem.item_id} marked as Claimed & Returned!`);
  };

  const handleUnclaim = async (itemId: number | string) => {
    if (!confirm('Reopen this item as Unclaimed?')) return;
    const targetItem = items.find((i) => i.item_id === itemId || i.id === itemId);
    if (targetItem) {
      try {
        await unclaimFirestoreLostFoundItem(targetItem);
      } catch (fsErr) {
        console.warn('Firestore unclaim sync error:', fsErr);
      }
    }
    const res = await unclaimItem(itemId);
    if (res.success && res.item) {
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId || i.id === itemId ? res.item! : i))
      );
      showToast('Item reopened as Unclaimed.');
    }
  };


  const handleViewDetails = (item: LostFoundItem) => {
    setTargetDetailItem(item);
    setIsDetailOpen(true);
  };

  const handlePrintNotice = (item: LostFoundItem) => {
    setTargetPrintItem(item);
    setIsPrintOpen(true);
  };

  const handleOpenStats = async () => {
    const freshStats = await fetchStats();
    if (freshStats) setStatsData(freshStats);
    setIsStatsOpen(true);
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset CampusTrace database to original sample university items?')) return;
    const freshItems = await resetDemoData();
    setItems(freshItems);
    showToast('Database reset to default university items.');
  };

  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      showToast('No items matching the current filter criteria to export.', 'error');
      return;
    }
    const success = exportItemsToCsv(filteredItems);
    if (success) {
      showToast(
        `Exported ${filteredItems.length} ${
          filteredItems.length === 1 ? 'item' : 'items'
        } to CSV spreadsheet!`,
        'success'
      );
    }
  };

  return (
    <>
      {/* 5-Second Welcoming Interface with CampusTrace Branding & Smooth Fade-In */}
      {showWelcomeScreen && (
        <WelcomingScreen
          durationMs={5000}
          onComplete={handleWelcomeComplete}
        />
      )}

      <div
        className={`bg-slate-50 font-sans text-slate-800 antialiased min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 transition-opacity duration-700 ease-in-out ${
          mainPageFadedIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Navigation Header */}
        <Header
        onOpenReport={handleOpenReport}
        onOpenStats={handleOpenStats}
        onResetDemo={handleResetDemo}
        onOpenEmailAlerts={() => handleOpenEmailAlerts()}
        activeAlertsCount={activeAlertsCount}
        unclaimedCount={unclaimedCount}
      />

      {/* Hero / Search Section */}
      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onSelectSuggestion={(tag) => setSearchQuery(tag)}
        totalMatches={filteredItems.length}
        totalItems={items.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Flash Message Banner (matching PHP feedback) */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Pills Bar & Sorting */}
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          statusFilter={statusFilter}
          onSelectStatus={setStatusFilter}
          typeFilter={typeFilter}
          onSelectType={setTypeFilter}
          sortBy={sortBy}
          onSelectSort={setSortBy}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          categoryCounts={categoryCounts}
          totalVisible={filteredItems.length}
          onExportCsv={handleExportCsv}
          onOpenEmailAlerts={(cat) => handleOpenEmailAlerts('', cat)}
        />

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="h-44 bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-1">
              No matching items found
            </h4>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
              {searchQuery
                ? `No items match "${searchQuery}". Try refining keywords or clearing category filters.`
                : 'No items currently reported in this category or status.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(searchQuery || selectedCategory !== 'All' || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setStatusFilter('All');
                    setTypeFilter('All');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() =>
                    handleOpenEmailAlerts(
                      searchQuery,
                      selectedCategory !== 'All' ? selectedCategory : undefined
                    )
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Alert Me When Found</span>
                </button>
              )}
              <button
                onClick={() => handleOpenReport('found')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Report an Item</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Items Grid */
          <div id="itemsGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.item_id}
                item={item}
                onClaimClick={handleOpenClaim}
                onViewDetails={handleViewDetails}
                onPrintNotice={handlePrintNotice}
                onUnclaim={handleUnclaim}
              />
            ))}
          </div>
        ) : (
          /* Compact Table View */
          <ItemTableView
            items={filteredItems}
            onClaimClick={handleOpenClaim}
            onViewDetails={handleViewDetails}
            onPrintNotice={handlePrintNotice}
          />
        )}
      </main>

      {/* University Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">CampusTrace</span>
            <span>•</span>
            <span>Smart Campus Lost &amp; Found Portal</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Security Dispatch &amp; Student Union Hub</span>
            <span>•</span>
            <button
              onClick={() => {
                setMainPageFadedIn(false);
                setShowWelcomeScreen(true);
              }}
              className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              title="Show the 5-second welcoming interface again"
            >
              Replay Welcome
            </button>
            <span>•</span>
            <button
              onClick={handleResetDemo}
              className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Reload Sample Data
            </button>
          </div>
        </div>
      </footer>


      {/* Modals */}
      {isReportOpen && (
        <ReportModal
          categories={categories}
          isOpen={isReportOpen}
          initialType={reportType}
          onClose={() => setIsReportOpen(false)}
          onItemAdded={handleItemAdded}
        />
      )}

      {isClaimOpen && targetClaimItem && (
        <ClaimModal
          item={targetClaimItem}
          isOpen={isClaimOpen}
          onClose={() => {
            setIsClaimOpen(false);
            setTargetClaimItem(null);
          }}
          onClaimSuccess={handleClaimSuccess}
        />
      )}

      {isDetailOpen && targetDetailItem && (
        <ItemDetailModal
          item={targetDetailItem}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setTargetDetailItem(null);
          }}
          onClaimClick={handleOpenClaim}
          onPrintNotice={handlePrintNotice}
          onEmailAlertItem={(item) => handleOpenEmailAlerts(item.item_name, item.category_name)}
        />
      )}

      {isPrintOpen && targetPrintItem && (
        <PrintNoticeModal
          item={targetPrintItem}
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setTargetPrintItem(null);
          }}
        />
      )}

      {isStatsOpen && statsData && (
        <StatsModal
          stats={statsData}
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {/* Campus Email Alerts & Push Notifications Modal */}
      {isEmailAlertsOpen && (
        <EmailAlertsModal
          isOpen={isEmailAlertsOpen}
          onClose={() => setIsEmailAlertsOpen(false)}
          categories={categories}
          initialKeyword={alertKeywordPrefill}
          initialCategory={alertCategoryPrefill}
          sampleItems={items}
          onAlertCreated={(newAlert) => {
            setSavedAlerts((prev) => [newAlert, ...prev]);
            setActiveAlertsCount((prev) => prev + 1);
            showToast('Alert created! Real-time browser push and email notifications are active.');
          }}
        />
      )}

      {/* Real-Time Browser Push Alert Floating Banner */}
      {activePushAlert && (
        <PushAlertToast
          item={activePushAlert.item}
          matchReason={activePushAlert.matchReason}
          onViewItem={(item) => {
            setTargetDetailItem(item);
            setIsDetailOpen(true);
          }}
          onDismiss={() => setActivePushAlert(null)}
        />
      )}
    </div>
    </>
  );
}
