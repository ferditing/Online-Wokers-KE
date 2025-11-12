// backend/src/utils/socket.ts
let ioInstance: any = null;
export function initSocket(io: any) { ioInstance = io; }
export function getIo() { return ioInstance; }
