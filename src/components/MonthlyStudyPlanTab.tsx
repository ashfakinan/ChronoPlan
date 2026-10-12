import React, { useState } from 'react';
import { useStudyPlanState } from './study-plan/useStudyPlanState';
import { StudyPlanHeader } from './study-plan/StudyPlanHeader';
import { StudyPlanProgressOverview } from './study-plan/StudyPlanProgressOverview';
import { StudyPlanMonthCard } from './study-plan/StudyPlanMonthCard';
import { StudyPlanChapterModal } from './study-plan/StudyPlanChapterModal';
import { StudyPlanMonthModal } from './study-plan/StudyPlanMonthModal';
import { StudyPlanCustomizeModal } from './study-plan/StudyPlanCustomizeModal';
import { StudyMonth, StudyChapter } from './study-plan/types';

export function MonthlyStudyPlanTab() {
  const {
    config,
    openMonths,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
    stats,
    getChapterState,
    toggleChapterStatus,
    toggleMonth,
    expandAll,
    collapseAll,
    resetToDefaults,
    exportPlanJSON,
    importPlanJSON,
    addChapter,
    updateChapter,
    deleteChapter,
    updateMonth,
    deleteMonth,
    saveCustomPlan,
  } = useStudyPlanState();

  // Modals state
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterData, setEditingChapterData] = useState<{
    monthId: string;
    subjectKey: string;
    chapter: StudyChapter;
  } | null>(null);
  const [initialAddMonthId, setInitialAddMonthId] = useState<string>('');
  const [initialAddSubjectKey, setInitialAddSubjectKey] = useState<string>('');

  const [editingMonth, setEditingMonth] = useState<StudyMonth | null>(null);

  const handleOpenAddChapter = (monthId?: string, subjectKey?: string) => {
    setEditingChapterData(null);
    setInitialAddMonthId(monthId || config.months[0]?.id || 'm1');
    setInitialAddSubjectKey(subjectKey || config.subjects[0]?.key || 'phy');
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapter = (monthId: string, subjectKey: string, chapter: StudyChapter) => {
    setEditingChapterData({ monthId, subjectKey, chapter });
    setIsChapterModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8f6f1] dark:bg-[#121317] pb-16 md:pb-0">
      {/* 1. Top Header & Search Toolbar */}
      <StudyPlanHeader
        title={config.title}
        subtitle={config.subtitle}
        subjects={config.subjects}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubjectFilter={selectedSubjectFilter}
        onSubjectFilterChange={setSelectedSubjectFilter}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExport={exportPlanJSON}
        onImport={importPlanJSON}
        onReset={resetToDefaults}
        onOpenCustomize={() => setIsCustomizeModalOpen(true)}
        onOpenAddChapter={() => handleOpenAddChapter()}
      />

      {/* 2. Syllabus Completion Progress Overview */}
      <StudyPlanProgressOverview
        subjects={config.subjects}
        totalChapters={stats.totalChapters}
        completedChapters={stats.completedChapters}
        routineChapters={stats.routineChapters}
        overallPercentage={stats.overallPercentage}
        bySubject={stats.bySubject}
      />

      {/* 3. Months Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {config.months.map((month) => (
          <StudyPlanMonthCard
            key={month.id}
            month={month}
            subjects={config.subjects}
            isOpen={Boolean(openMonths[month.id])}
            onToggleOpen={() => toggleMonth(month.id)}
            selectedSubjectFilter={selectedSubjectFilter}
            searchQuery={searchQuery}
            getChapterState={getChapterState}
            onToggleChapterStatus={toggleChapterStatus}
            onEditChapter={handleOpenEditChapter}
            onDeleteChapter={deleteChapter}
            onEditMonth={(m) => setEditingMonth(m)}
            onDeleteMonth={deleteMonth}
            onOpenAddChapter={(mId, subKey) => handleOpenAddChapter(mId, subKey)}
          />
        ))}
      </div>

      {/* Chapter Creation & Edit Modal */}
      {isChapterModalOpen && (
        <StudyPlanChapterModal
          isOpen={isChapterModalOpen}
          onClose={() => {
            setIsChapterModalOpen(false);
            setEditingChapterData(null);
          }}
          months={config.months}
          subjects={config.subjects}
          editingChapter={editingChapterData}
          initialMonthId={initialAddMonthId}
          initialSubjectKey={initialAddSubjectKey}
          onSave={(monthId, subjectKey, paper, number, name, chapterId, oldMonthId, oldSubjectKey) => {
            if (chapterId && oldMonthId && oldSubjectKey) {
              updateChapter(
                oldMonthId,
                oldSubjectKey,
                chapterId,
                monthId,
                subjectKey,
                paper,
                number,
                name
              );
            } else {
              addChapter(monthId, subjectKey, paper, number, name);
            }
          }}
        />
      )}

      {/* Month Title Edit Modal */}
      {editingMonth && (
        <StudyPlanMonthModal
          isOpen={Boolean(editingMonth)}
          onClose={() => setEditingMonth(null)}
          month={editingMonth}
          onSave={updateMonth}
        />
      )}

      {/* Plan Settings & Customization Modal */}
      {isCustomizeModalOpen && (
        <StudyPlanCustomizeModal
          isOpen={isCustomizeModalOpen}
          onClose={() => setIsCustomizeModalOpen(false)}
          config={config}
          onSave={saveCustomPlan}
        />
      )}
    </div>
  );
}
