import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PlannerProvider } from './context/PlannerContext';
import { MadnessProvider } from './context/MadnessContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PlannerView } from './components/PlannerView';
import { DailyTodoTab } from './components/DailyTodoTab';
import { ScatteredWeeklyMadnessTab } from './components/ScatteredWeeklyMadnessTab';
import { CalendarTab } from './components/CalendarTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { MorningReportModal } from './components/MorningReportModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppUpdateToast } from './components/AppUpdateToast';
import { ActiveTab } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f6f1] dark:bg-[#121317] text-[#1f2126] dark:text-[#eceef2] font-sans selection:bg-blue-500/20">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace (Sidebar + Tab Content) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar & Mobile Slide-Over Drawer */}
        <Sidebar
          isOpenOnMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          setActiveTab={setActiveTab}
        />

        {/* Tab Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'planner' && <PlannerView />}
          {activeTab === 'todos' && <DailyTodoTab />}
          {activeTab === 'madness' && <ScatteredWeeklyMadnessTab />}
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

      {/* App Update Toast */}
      <AppUpdateToast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlannerProvider>
          <MadnessProvider>
            <MainApp />
          </MadnessProvider>
        </PlannerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
