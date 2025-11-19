import api from './api';

export async function createEscrow(payload: { jobId: string; applicationId: string; amount: number; currency?: string }){
  const res = await api.post('/payments/escrow', payload);
  return res.data.payment ?? res.data;
}

export async function fundEscrow(paymentId: string){
  const res = await api.post(`/payments/${paymentId}/fund`);
  return res.data.payment ?? res.data;
}

export async function requestRelease(paymentId: string){
  const res = await api.post(`/payments/${paymentId}/request-release`);
  return res.data.payment ?? res.data;
}

export async function adminRelease(paymentId: string){
  const res = await api.patch(`/payments/${paymentId}/release`);
  return res.data.payment ?? res.data;
}

export async function getPayments(query?: any){
  const res = await api.get('/payments', { params: query });
  return res.data.payments ?? res.data;
}
