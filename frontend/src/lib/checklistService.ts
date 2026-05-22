import axios from 'axios';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface ChecklistTemplate {
  _id?: string;
  level: string;
  stage: string;
  items: string[];
}

export const checklistService = {
  // Template CRUD
  createTemplate: async (data: { level: string; stage: string; items: string[] }, token: string) => {
    const response = await axios.post(`${baseUrl}/template`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateTemplate: async (templateId: string, items: string[], token: string) => {
    const response = await axios.put(`${baseUrl}/template/${templateId}`, { items }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteTemplate: async (templateId: string, token: string) => {
    const response = await axios.delete(`${baseUrl}/template/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Student Checklist Operations
  getAllStudentChecklists: async (studentId: string, token: string) => {
    const response = await axios.get(`${baseUrl}/student/${studentId}/getAllStudentChecklists`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getStudentChecklist: async (studentId: string, stage: string, token: string) => {
    const response = await axios.get(`${baseUrl}/student/${studentId}/${stage}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  tickItem: async (checklistId: string, templateItemId: string, ticked: boolean, token: string) => {
    const response = await axios.patch(`${baseUrl}/${checklistId}/tick`, { templateItemId, ticked }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  approveForNextStage: async (checklistId: string, token: string) => {
    const response = await axios.patch(`${baseUrl}/${checklistId}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
