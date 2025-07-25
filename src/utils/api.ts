// utils/api.ts
export const API_BASE_URL = "https://api.theopenshift.com";

export interface StaffProfile {
    fname: string;
    lname: string;
    address: string;
    dob: string;
    gender: string;
    phone: string;
    bio: string;
    emergency_contact: string;
    emergency_contact_phone: string;
    skills: string[];
    tfn: string;
}

export async function getAccessToken(): Promise<string> {
    const sessionRes = await fetch("/api/auth/session");
    if (!sessionRes.ok) throw new Error("Failed to fetch session.");
    const session = await sessionRes.json();
    if (!session?.accessToken) throw new Error("No access token available");
    return session.accessToken;
}

export async function apiRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" = "GET", // Default to GET for safety
    body?: any
): Promise<T> {
    try {
        const sessionRes = await fetch("/api/auth/session"); // Fetch session directly
        if (!sessionRes.ok) {
            throw new Error("Failed to fetch session.");
        }
        const session = await sessionRes.json();
        console.log("Session:", session);
        if (!session?.accessToken) throw new Error("No access token available");

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${session.accessToken}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (errorText.includes('User already has a role assigned')) {
                throw new Error('You have already completed your profile or have a role assigned. If you believe this is a mistake, please contact support.');
            }
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Handle empty response
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

export const api = {
    // Create user
    updateStaffProfile: (data: Partial<StaffProfile>) =>
        apiRequest<StaffProfile>('/v1/users/user', 'POST', data),

    // Get current user profile
    getProfile: () => apiRequest<StaffProfile>('/v1/users/me'),

    // Create a new booking (job listing)
    createBooking: (data: any) => apiRequest<any>('/v1/bookings/new', 'POST', data),

    // Get my bookings (job listings)
    getMyBookings: () => apiRequest<any>('/v1/bookings/my_bookings', 'GET'),

    // Get a specific booking by ID
    getBookingById: (booking_id: string) => apiRequest<any>(`/v1/bookings/${booking_id}`, 'GET'),

    // Cancel a booking (job listing)
    cancelBooking: (booking_id: number) => apiRequest<any>(`/v1/bookings/cancel?booking_id=${booking_id}`, 'PATCH'),

    // Edit a booking (job listing)
    editBooking: (booking_id: number, data: any) => apiRequest<any>(`/v1/bookings/${booking_id}`, 'PATCH', data),

    // Search bookings (jobs)
    searchBookings: (params: Record<string, any>) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest<any>(`/v1/users/search_bookings?${query}`, 'GET');
    },

    // Get organisation details by org_id
    getOrgById: (org_id: string) => apiRequest<any>(`/v1/orgs/${org_id}`, 'GET'),

    // Send request for a job/booking
    sendJobRequest: (booking_id: number, rate: number, comment: string) => apiRequest<any>(`/v1/bookings/request`, 'POST', { booking_id, rate, comment }),

    // Get my requests (optionally filtered by booking_id)
    getMyRequests: (booking_id?: number) => {
        const query = booking_id ? `?booking_id=${booking_id}` : '';
        return apiRequest<any>(`/v1/bookings/my_requests${query}`, 'GET');
    },

    // Respond to a booking request (approve/reject)
    respondToRequest: (request_id: number, approve: boolean) =>
        apiRequest<any>(`/v1/bookings/request_response/${request_id}?approve=${approve}`, 'POST'),

    // Get applicants for a job (all requests for a booking)
    getApplicantsForJob: (booking_id: number) =>
        api.getMyRequests(booking_id),

    // Fetch a user profile by user_id
    getUserProfileById: (user_id: string) => apiRequest<any>(`/v1/users/${user_id}`, 'GET'),

    // Check in/out for a booking (timesheet)
    checkInBooking: (booking_id: number, checkOut: boolean = false) =>
        apiRequest<any>(
            `/v1/bookings/timesheet/check_in/${booking_id}${checkOut ? '?check_out=true' : ''}`,'POST'),

    // Send timesheet
    sendTimesheet: (booking_id: number, data: any) =>
        apiRequest<any>(`/v1/bookings/timesheet/request/${booking_id}`, 'POST', data),

    // Approve or reject a timesheet
    approveTimesheet: (booking_id: number, approve: boolean, amount?: string) =>
        apiRequest<any>(
            `/v1/bookings/timesheet/request_response/${booking_id}?approve=${approve}`,'POST', amount !== undefined ? { amount } : undefined),

    /**
     * Creates a booking payment session and returns the payment URL.
     * @param bookingId The ID of the booking to create a payment session for.
     * @returns A promise that resolves to an object containing the payment URL.
     */
    createBookingPaymentSession: async (bookingId: number) => {
        return apiRequest<any>(`/v1/payments/booking_payment?booking_id=${bookingId}`, 'POST', {});
    },

    /**
     * Fetches the Stripe dashboard URL for the connected account.
     * @returns A promise that resolves to an object containing the URL.
     */
    getStripeDashboardLink: () => apiRequest<any>('/v1/payments/dashboard', 'GET'),
};