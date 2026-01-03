import { api } from './api';

export const consultantAPI = {
    updateProfile: (data: any) => api.put('/new/consultant/profile', data),
    getPublicProfile: (id: string) => api.get(`/new/consultant/${id}`),
    createService: (data: any) => api.post('/new/services', data),
    getServices: (consultantId: string) => api.get('/new/services', { params: { consultantId } }),
    getServiceById: (id: string) => api.get(`/new/services/${id}`),
    updateService: (id: string, data: any) => api.put(`/new/services/${id}`, data),
    deleteService: (id: string) => api.delete(`/new/services/${id}`),
};

export const orderAPI = {
    createBooking: (data: any) => api.post('/new/bookings', data),
    payBooking: (bookingId: string) => api.post('/new/bookings/pay', { bookingId }),
    getMyBookings: () => api.get('/new/bookings/my'),
    cancelBooking: (bookingId: string, reason?: string) =>
        api.post(`/new/bookings/${bookingId}/cancel`, { reason }),
    rescheduleBooking: (bookingId: string, startAt: string) =>
        api.post(`/new/bookings/${bookingId}/reschedule`, { startAt }),
    startMeeting: (bookingId: string) => api.post(`/new/bookings/${bookingId}/start`),
    endMeeting: (bookingId: string) => api.post(`/new/bookings/${bookingId}/end`),
};



