// frontend/src/services/skills.service.ts
import api from './api';

export async function listSkills() {
  const res = await api.get('/skills');
  return res.data; // { skills: [...] }
}
