export const environment = {
  production: true,
  apiBase:
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
      ? `${window.location.protocol}//${window.location.hostname}:3000/api`
      : 'http://192.168.10.150:3000/api'
};

