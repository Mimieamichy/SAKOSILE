import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChecklistContent = Record<string, Record<string, string[]>>;

const DEFAULT_CHECKLIST_CONTENT: ChecklistContent = {
  msc: {
    start: [
      "Registration of student",
      "Topic approval by department"
    ],
    proposal: [],
    internal: [
      "Correct binding format (soft cover spiral or spine binding)",
      "Cover Memo attached",
      "Readiness form attached",
      "Complete Number of Hard copies (Masters-2)",
      "Collection of Internal Examination Score Sheet form from SPGS",
      "All submissions should pass through the office of the Dean of your Faculty"
    ],
    external: [
      "Successful internal defense with corrections",
      "Submission for external examination",
      "Reference: Submission Checklist for external examination_090914.pdf"
    ],
    completed: [
      "Final thesis submission",
      "Reference: Final Submission Checklist_090921.pdf"
    ]
  },
  phd: {
    start: [
      "Registration of Ph.D candidate",
      "Topic approval"
    ],
    proposal_defense: [
      "Correct binding format (soft cover press binding)",
      "Cover Memo attached",
      "Ph. D Readiness form attached",
      "Complete Number of Hard copies Two (2)",
      "All submissions should pass through the office of the Dean of your Faculty."
    ],
    second_seminar: [
      "Correct binding format (soft cover press binding)",
      "Cover Memo attached",
      "Ph. D Readiness form attached",
      "Complete Number of Hard copies Two (2)",
      "All submissions should pass through the office of the Dean of your Faculty."
    ],
    third_seminar: [
      "Correct binding format (soft cover spiral or spine binding)",
      "Cover Memo attached",
      "Readiness form attached",
      "Evidence of 1st and 2nd Seminars with attendance",
      "Complete Number of Hard copies (PhD-2)",
      "Collection of Internal Examination Score Sheet form from SPGS",
      "All submissions should pass through the office of the Dean of your Faculty"
    ],
    external_defense: [
      "Internal defense successful",
      "External defense completed",
      "Reference: Submission Checklist for external examination_090914.pdf"
    ],
    completed: [
      "Doctoral thesis final submission",
      "Reference: Final Submission Checklist_090921.pdf"
    ]
  }
};

interface ChecklistStore {
  content: ChecklistContent;
  updateStageContent: (level: string, stage: string, items: string[]) => void;
  resetToDefault: () => void;
}

export const useChecklistStore = create<ChecklistStore>()(
  persist(
    (set) => ({
      content: DEFAULT_CHECKLIST_CONTENT,
      updateStageContent: (level, stage, items) => 
        set((state) => ({
          content: {
            ...state.content,
            [level]: {
              ...state.content[level],
              [stage]: items
            }
          }
        })),
      resetToDefault: () => set({ content: DEFAULT_CHECKLIST_CONTENT }),
    }),
    {
      name: 'pg-admin-checklist-storage',
    }
  )
);
