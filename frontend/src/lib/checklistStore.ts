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

const DEFAULT_READINESS_TEMPLATE = `FEDERAL UNIVERSITY LAFIA
College of Postgraduate Studies
POSTGRADUATE ORAL INTERNAL DEFENCE READINESS FORM

Date: {{DATE}}
This is to notify the School of Postgraduate Studies that the candidate whose particulars appear below, is ready for Internal Oral Defense with the following details:
1. Name: {{NAME}}
   Matric. Number: {{MATRIC_NO}}
   Programme of Study: {{PROGRAMME}}
   Course of Study: {{DEPARTMENT}}
   Title of Dissertation/Thesis: {{TITLE}}
   Supervisor(s):
     i- {{SUPERVISOR_1}}
    ii- {{SUPERVISOR_2}}
   iii- {{SUPERVISOR_3}}
   Proposed Date: {{PROPOSED_DATE}} Time: {{TIME}}
   Venue: {{VENUE}}

Thank you.

Signature/Date: ………………………………….
Name of Head of Department: ……………………………………….

FOR OFFICE USE:
DATE RECEIVED:
PROPOSED DATE SUITABLE/NOT SUITABLE
Provost’s CPGS COMMENT: ………………………………………………………………………………………………………………………
………………………………………………………………………………………………………………………………………………………….
SIGNATURE/ DATE: ………………………………………………………………………… STAMP:`;

interface ChecklistStore {
  content: ChecklistContent;
  readinessTemplate: string;
  updateStageContent: (level: string, stage: string, items: string[]) => void;
  updateReadinessTemplate: (template: string) => void;
  resetToDefault: () => void;
}

export const useChecklistStore = create<ChecklistStore>()(
  persist(
    (set) => ({
      content: DEFAULT_CHECKLIST_CONTENT,
      readinessTemplate: DEFAULT_READINESS_TEMPLATE,
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
      updateReadinessTemplate: (template) => set({ readinessTemplate: template }),
      resetToDefault: () => set({ content: DEFAULT_CHECKLIST_CONTENT, readinessTemplate: DEFAULT_READINESS_TEMPLATE }),
    }),
    {
      name: 'pg-admin-checklist-storage',
    }
  )
);
