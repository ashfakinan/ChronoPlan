import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlannerProvider } from './context/PlannerContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PlannerView } from './components/PlannerView';
import { DailyTodoTab } from './components/DailyTodoTab';
import { CalendarTab } from './components/CalendarTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { MorningReportModal } from './components/MorningReportModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ActiveTab } from './types';
import { Cloud, X } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [dismissedSyncBanner, setDismissedSyncBanner] = useState<boolean>(false);
  const { currentUser, setIsAuthModalOpen } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f6f1] dark:bg-[#121317] text-[#1f2126] dark:text-[#eceef2] font-sans selection:bg-blue-500/20">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Cloud Sync Notice for Guests (Eye-soothing subtle slate/stone bar) */}
      {!currentUser && !dismissedSyncBanner && (
        <div className="bg-[#f4f2ec] dark:bg-[#22242b] border-b border-[#e5e2da] dark:border-[#292b34] text-[#1f2126] dark:text-[#eceef2] px-3 sm:px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">
              Currently running in local preview mode.
            </span>
            <span className="font-medium">
              Sign in with Google to sync all planners, tasks & to-dos across all your devices.
            </span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="ml-1 sm:ml-2 px-2.5 py-0.5 bg-[#1f2126] text-[#fdfcf9] dark:bg-[#eceef2] dark:text-[#121317] rounded-md font-semibold text-[11px] transition-colors"
            >
              Sign In
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDismissedSyncBanner(true)}
            className="text-[#8c909c] hover:text-[#1f2126] p-1 rounded-md transition-colors"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace (Sidebar + Tab Content) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar & Mobile Slide-Over Drawer */}
        <Sidebar
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Tab Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'planner' && <PlannerView />}
          {activeTab === 'todos' && <DailyTodoTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Daily Review / Morning Report Modal */}
      <MorningReportModal />

      {/* Sign-In Authentication Modal & Diagnostics */}
      <AuthModal />

      {/* Real-time Offline & Sync Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlannerProvider>
          <MainApp />
        </PlannerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
