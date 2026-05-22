import axios from 'axios';

const baseUrl = import.meta.env.VITE_BACKEND_URL;

export interface ReadinessTemplate {
  _id?: string;
  school: string;
  level: string;
  stage: string;
  form: string;
}

export interface StudentReadinessForm {
  studentId: string;
  templateId: string;
  formData: any;
  status: string;
}

export const readinessService = {
  // Template CRUD
  createTemplate: async (data: { school: string; level: string; stage: string; form: string }, token: string) => {
    const response = await axios.post(`${baseUrl}/template`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateTemplate: async (templateId: string, form: string, token: string) => {
    const response = await axios.patch(`${baseUrl}/template/${templateId}`, { form }, {
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

  getTemplate: async (templateId: string, token: string) => {
    const response = await axios.get(`${baseUrl}/template/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getAllTemplates: async (token: string) => {
    const response = await axios.get(`${baseUrl}/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Student Readiness Form
  getStudentReadinessForm: async (studentId: string, token: string) => {
    const response = await axios.get(`${baseUrl}/student/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
