import api from "./api";

export interface RegisterPayLoad { name: string; email: string; password: string; role?: 'worker' | 'employer'; }
export interface LoginPayLoad { email: string; password: string;}

export async function register(payload: RegisterPayLoad) {
    const res = await api.post('/auth/register', payload);
    return res.data;
}

export async function login(payload: LoginPayLoad){
    const res = await api.post('/auth/login', payload);
    return res.data;
}

export async function me(){
    const res = await api.get('/auth/me');
    return res.data;
}