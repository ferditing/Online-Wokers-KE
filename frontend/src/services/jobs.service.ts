import api from './api'

export async function listJobs(params?: any){
    const res = await api.get('/jobs', { params });
    return res.data;
}

export async function getJob(id: string){
    const res = await api.get(`/jobs/${id}`);
    return res.data;
}

export async function createJob(payload: {title: string; description: string; budget: number; currency?: string;}){
    const res = await api.post('/jobs', payload);
    return res.data;
}

export async function applyToJob(jobId: string, payload: { coverMessage: string; proposedPrice?: number ;}){
    const res = await api.post(`/jobs/${jobId}/submit`, payload);
    return res.data;
}

export async function submitDeliverable(jobId: string, payload: { files: string[]; notes?: string }) {
  const res = await api.post(`/jobs/${jobId}/submit`, payload);
  return res.data;
}