import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  BarChart3,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Plus,
  LogOut,
  Cloud,
  Layers,
  FileText,
  RefreshCw,
  Shuffle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlanner } from '../context/PlannerContext';
import { useMadness } from '../context/MadnessContext';
import { ActiveTab } from '../types';
import { getTodayISO } from '../utils/dateUtils';
import { PlannerModal } from './PlannerModal';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileSidebar?: () => void;
}

export function Navbar({ activeTab, setActiveTab, onOpenMobileSidebar }: NavbarProps) {
  const { currentUser, signInWithGoogle, signOutUser, setIsAuthModalOpen } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    planners,
    activePlanner,
    setActivePlannerId,
    setShowMorningReport,
    todos,
  } = usePlanner();
  const { pendingTasksCount: pendingMadnessTasks } = useMadness();

  const [isPlannerDropdownOpen, setIsPlannerDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNewPlannerModalOpen, setIsNewPlannerModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [updateCheckStatus, setUpdateCheckStatus] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setUpdateCheckStatus('Checking...');
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { __chronoUpdateSW?: () => Promise<void> }).__chronoUpdateSW
    ) {
      await (window as unknown as { __chronoUpdateSW?: () => Promise<void> }).__chronoUpdateSW?.();
    }
    setTimeout(() => {
      setUpdateCheckStatus('Latest version ready');
      setTimeout(() => setUpdateCheckStatus(null), 3000);
    }, 900);
  };

  const today = getTodayISO();
  const pendingTodosToday = todos.filter((t) => t.date === today && !t.isCompleted).length;

  const handleSignIn = async () => {
    setIsAuthModalOpen(true);
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-[#e5e2da] dark:border-[#292b34] bg-[#fdfcf9]/95 dark:bg-[#1a1b20]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Brand & Desktop Tabs */}
        <div className="flex items-center gap-6">
          {/* Brand Wordmark (Single clean typography element) */}
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-hidden min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#273347] dark:bg-[#2e3e57] text-[#fdfcf9] flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#1f2126] dark:text-[#eceef2]">
                Chrono<span className="text-blue-600 dark:text-blue-400">Plan</span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#606470] dark:text-[#9aa0ae]">
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px] ${
                activeTab === 'planner'
                  ? 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  : 'hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Planner
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px] ${
                activeTab === 'todos'
                  ? 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  : 'hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Daily To-Do
              {pendingTodosToday > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {pendingTodosToday}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('madness')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px] ${
                activeTab === 'madness'
                  ? 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  : 'hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Monthly Study Plan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px] ${
                activeTab === 'calendar'
                  ? 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  : 'hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px] ${
                activeTab === 'analytics'
                  ? 'bg-[#f4f2ec] dark:bg-[#22242b] text-[#1f2126] dark:text-[#eceef2] font-semibold'
                  : 'hover:text-[#1f2126] dark:hover:text-[#eceef2]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Center / Planner Switcher (Desktop & Tablet) */}
        {activeTab === 'planner' && (
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setIsPlannerDropdownOpen(!isPlannerDropdownOpen)}
              className="px-3 py-1.5 text-xs bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] border border-[#e5e2da] dark:border-[#292b34] rounded-lg text-[#1f2126] dark:text-[#eceef2] flex items-center gap-2 transition-colors min-h-[38px]"
            >
              <span className="text-[#8c909c] font-normal">Planner:</span>
              <span className="truncate max-w-[150px] font-semibold">
                {activePlanner ? activePlanner.title : 'Select'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8c909c]" />
            </button>

            {isPlannerDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-64 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl shadow-xl p-2 z-40">
                <div className="text-[10px] font-semibold text-[#8c909c] uppercase tracking-wider px-2 py-1">
                  Switch Planners ({planners.length})
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {planners.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePlannerId(p.id);
                        setIsPlannerDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between min-h-[40px] ${
                        activePlanner?.id === p.id
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold'
                          : 'text-[#1f2126] dark:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b]'
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] text-[#8c909c]">
                        {p.dayParts?.length || 5} parts
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-[#e5e2da] dark:border-[#292b34]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlannerDropdownOpen(false);
                      setIsNewPlannerModalOpen(true);
                    }}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> + New Planner
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Notes Drawer Trigger (Mobile only) */}
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Open Notes & Schedule"
              aria-label="Open Notes & Schedule"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {/* Daily Review Button */}
          <button
            type="button"
            onClick={() => setShowMorningReport(true)}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] text-[#1f2126] dark:text-[#eceef2] border border-[#e5e2da] dark:border-[#292b34] rounded-lg transition-colors flex items-center gap-1.5 min-h-[40px]"
            title="Daily Review Report"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Daily Review</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="navbar" />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-[#606470] dark:text-[#9aa0ae] hover:text-[#1f2126] dark:hover:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* Google Sign-in / User Profile */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1.5 p-1 pl-2 bg-[#f4f2ec] dark:bg-[#22242b] hover:bg-[#eae7df] dark:hover:bg-[#2a2d36] rounded-lg transition-colors text-xs font-medium text-[#1f2126] dark:text-[#eceef2] min-h-[40px]"
              >
                <span title="Cloud Synced">
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="hidden md:inline max-w-[90px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-[#e5e2da] dark:ring-[#292b34]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-md bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-[#fdfcf9] dark:bg-[#1a1b20] border border-[#e5e2da] dark:border-[#292b34] rounded-xl shadow-xl p-3 z-40 space-y-2">
                  <div className="pb-2 border-b border-[#e5e2da] dark:border-[#292b34]">
                    <p className="text-xs font-semibold text-[#1f2126] dark:text-[#eceef2] truncate">
                      {currentUser.displayName || (currentUser.isAnonymous ? 'Guest User' : 'Google Account')}
                    </p>
                    <p className="text-[11px] text-[#8c909c] truncate">
                      {currentUser.isAnonymous ? 'Temporary session' : currentUser.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Cloud className="w-3 h-3" /> Cloud Synced
                    </div>
                  </div>

                  {currentUser.isAnonymous && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2 min-h-[38px]"
                    >
                      Connect Google Account
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    className="w-full px-3 py-1.5 text-xs font-medium text-[#1f2126] dark:text-[#eceef2] hover:bg-[#f4f2ec] dark:hover:bg-[#22242b] rounded-lg transition-colors flex items-center justify-between min-h-[38px]"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${
                          updateCheckStatus === 'Checking...' ? 'animate-spin' : ''
                        }`}
                      />
                      <span>{updateCheckStatus || 'Check for Updates'}</span>
                    </div>
                    <span className="text-[10px] text-[#8c909c]">v1.7.1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      signOutUser();
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 min-h-[40px]"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1f2126] text-[#fdfcf9] hover:bg-[#343842] dark:bg-[#eceef2] dark:text-[#121317] dark:hover:bg-[#d8dbe2] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 min-h-[40px]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>{isSigningIn ? 'Connecting...' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </header>

      <PlannerModal
        isOpen={isNewPlannerModalOpen}
        onClose={() => setIsNewPlannerModalOpen(false)}
      />
    </>
  );
}
