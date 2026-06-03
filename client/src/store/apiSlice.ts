import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryApi } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { apiHandler, ApiHandlerError } from "@/lib/api/apiHandler";
import { clearAuthCookie } from "@/lib/auth";
import { logout, mapAuthUserDto, setCredentials } from "@/store/authSlice";
import { updateContext } from "@/services/assistant/context.service";
import type {
  AddUnavailabilityRequest,
  AdminAppointmentsQuery,
  AdminAppointmentInsightsResponse,
  AppointmentSlotsResponse,
  AppointmentCreateResponse,
  AppointmentMutationResponse,
  AppointmentsListResponse,
  AuthResponse,
  BedAvailabilityRequest,
  BedAvailabilityResponse,
  CreateAppointmentRequest,
  CreateScheduleRequest,
  DeleteResponse,
  DoctorAnalyticsListResponse,
  DoctorAvailabilityResponse,
  DoctorResponse,
  DoctorsListResponse,
  LoginRequest,
  NoShowPredictionRequest,
  NoShowPredictionResponse,
  PriceEstimationRequest,
  PriceEstimationResponse,
  PatientAnalyticsListResponse,
  QueueStatusResponse,
  RecommendationsResponse,
  RegisterDoctorRequest,
  RegisterPatientRequest,
  ResourceAllocationPredictionRequest,
  ScheduleDto,
  SchedulesListResponse,
  SlotAnalysisResponse,
  SurgeryPlanRequest,
  SurgeryPlanResponse,
  TrainModelRequest,
  UnavailabilitiesListResponse,
  UnavailabilityDto,
  UpdateScheduleRequest,
  UpdateAppointmentByDoctorRequest,
  WaitingTimePredictionRequest,
  AssistantRequest,
  AssistantResponse,
} from "@/types/api";

type ApiResult<T> =
  | { data: T }
  | { error: { status?: number; data: unknown } };

type ApiAuthState = {
  auth: {
    token?: string | null;
  };
};

async function runRequest<T>(
  request: Promise<T>,
  api: BaseQueryApi,
  silent = false
): Promise<ApiResult<T>> {
  const token = (api.getState() as ApiAuthState).auth.token;

  try {
    const data = await request;
    return { data };
  } catch (error) {
    const apiError = error as ApiHandlerError;
    const status = apiError.status;
    const message = apiError.message || "Request failed";

    if (status === 401) {
      if (token) {
        api.dispatch(logout());
        clearAuthCookie();
        if (!silent) toast.error("Session expired. Please sign in again.");
      } else if (!silent) {
        toast.error(message);
      }
    } else if (status === 403) {
      if (!silent) toast.error("You do not have permission to perform this action.");
    } else if (status === 500) {
      if (!silent) toast.error("Server error. Please try again later.");
    } else if (status && status >= 400 && !silent) {
      toast.error(message);
    }

    return {
      error: {
        status,
        data: apiError.data ?? { message },
      },
    };
  }
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Appointment", "Doctor", "DoctorProfile", "Schedule", "Unavailability", "Availability", "Resource"],
  endpoints: (builder) => ({
    loginPatient: builder.mutation<AuthResponse, LoginRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/login", body, {
            token: (api.getState() as any).auth.token,
          }),
          api,
          true
        );
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              token: data.token,
              user: mapAuthUserDto(data.user),
            })
          );
          try {
            const mapped = mapAuthUserDto(data.user);
            if (mapped?.id && mapped?.age) {
              updateContext(mapped.id, { entities: { age: mapped.age } });
            }
          } catch {}
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    loginDoctor: builder.mutation<AuthResponse, LoginRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/doctor/login", body, {
            token: (api.getState() as any).auth.token,
          }),
          api,
          true
        );
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              token: data.token,
              user: mapAuthUserDto(data.user),
            })
          );
          try {
            const mapped = mapAuthUserDto(data.user);
            if (mapped?.id && mapped?.age) {
              updateContext(mapped.id, { entities: { age: mapped.age } });
            }
          } catch {}
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    loginAdmin: builder.mutation<AuthResponse, LoginRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/admin/login", body, {
            token: (api.getState() as any).auth.token,
          }),
          api,
          true
        );
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              token: data.token,
              user: mapAuthUserDto(data.user),
            })
          );
          try {
            const mapped = mapAuthUserDto(data.user);
            if (mapped?.id && mapped?.age) {
              updateContext(mapped.id, { entities: { age: mapped.age } });
            }
          } catch {}
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    registerPatient: builder.mutation<AuthResponse, RegisterPatientRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/register", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              token: data.token,
              user: mapAuthUserDto(data.user),
            })
          );
          try {
            const mapped = mapAuthUserDto(data.user);
            if (mapped?.id && mapped?.age) {
              updateContext(mapped.id, { entities: { age: mapped.age } });
            }
          } catch {}
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    registerDoctor: builder.mutation<AuthResponse, RegisterDoctorRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/doctor/register", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              token: data.token,
              user: mapAuthUserDto(data.user),
            })
          );
          try {
            const mapped = mapAuthUserDto(data.user);
            if (mapped?.id && mapped?.age) {
              updateContext(mapped.id, { entities: { age: mapped.age } });
            }
          } catch {}
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),

    getDoctors: builder.query<
      DoctorsListResponse,
      { search?: string; specialization?: string } | void
    >({
      async queryFn(arg, api: BaseQueryApi): Promise<ApiResult<DoctorsListResponse>> {
        const params: Record<string, string> = {};
        if (arg) {
          if (arg.search) params.search = arg.search;
          if (arg.specialization) params.specialization = arg.specialization;
        }
        return runRequest(
          apiHandler.get<DoctorsListResponse>("doctors", {
            token: (api.getState() as any).auth.token,
            params,
          }),
          api
        );
      },
      providesTags: ["Doctor"],
    }),
    getAdminDoctorAnalytics: builder.query<
      DoctorAnalyticsListResponse,
      { page?: number; limit?: number; search?: string }
    >({
      async queryFn(
        { page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {},
        api: BaseQueryApi
      ): Promise<ApiResult<DoctorAnalyticsListResponse>> {
        return runRequest(
          apiHandler.get<DoctorAnalyticsListResponse>("doctors/analytics", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: { page, limit, search: search.trim() || undefined },
          }),
          api
        );
      },
      providesTags: ["Doctor"],
    }),
    getAdminPatients: builder.query<
      PatientAnalyticsListResponse,
      { page?: number; limit?: number; search?: string }
    >({
      async queryFn(
        { page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {},
        api: BaseQueryApi
      ): Promise<ApiResult<PatientAnalyticsListResponse>> {
        return runRequest(
          apiHandler.get<PatientAnalyticsListResponse>("patients", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: { page, limit, search: search.trim() || undefined },
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    getDoctorById: builder.query<DoctorResponse, string>({
      async queryFn(id, api: BaseQueryApi): Promise<ApiResult<DoctorResponse>> {
        return runRequest(
          apiHandler.get<DoctorResponse>(`doctors/${id}`, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      providesTags: (_result, _err, id) => [{ type: "Doctor", id }],
    }),
    getDoctorProfile: builder.query<DoctorResponse, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<DoctorResponse>> {
        return runRequest(
          apiHandler.get<DoctorResponse>("doctors/me", {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      providesTags: ["DoctorProfile"],
    }),

    createDoctorSchedule: builder.mutation<unknown, CreateScheduleRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("doctors/schedules", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["DoctorProfile", "Schedule"],
    }),
    addDoctorUnavailability: builder.mutation<unknown, AddUnavailabilityRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("doctors/unavailability", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["DoctorProfile", "Unavailability"],
    }),
    getDoctorAvailability: builder.query<
      DoctorAvailabilityResponse,
      { doctorId: string; date: string; slotDurationMinutes?: number }
    >({
      async queryFn(
        { doctorId, date, slotDurationMinutes },
        api: BaseQueryApi
      ): Promise<ApiResult<DoctorAvailabilityResponse>> {
        return runRequest(
          apiHandler.get<DoctorAvailabilityResponse>(`doctors/${doctorId}/availability`, {
            token: (api.getState() as any).auth.token,
            params: { date, slotDurationMinutes },
          }),
          api
        );
      },
      providesTags: ["Availability"],
    }),
    getDoctorSchedules: builder.query<SchedulesListResponse, string>({
      async queryFn(doctorId, api: BaseQueryApi): Promise<ApiResult<SchedulesListResponse>> {
        return runRequest(
          apiHandler.get<SchedulesListResponse>(`doctors/${doctorId}/schedules`, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      providesTags: ["Schedule"],
    }),
    updateDoctorSchedule: builder.mutation<ScheduleDto, { scheduleId: string; data: UpdateScheduleRequest }>({
      async queryFn({ scheduleId, data }, api: BaseQueryApi): Promise<ApiResult<ScheduleDto>> {
        return runRequest(
          apiHandler.put<ScheduleDto>(`doctors/schedules/${scheduleId}`, data, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Schedule"],
    }),
    deleteDoctorSchedule: builder.mutation<DeleteResponse, string>({
      async queryFn(scheduleId, api: BaseQueryApi): Promise<ApiResult<DeleteResponse>> {
        return runRequest(
          apiHandler.delete<DeleteResponse>(`doctors/schedules/${scheduleId}`, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Schedule"],
    }),
    getDoctorUnavailabilities: builder.query<UnavailabilitiesListResponse, string>({
      async queryFn(doctorId, api: BaseQueryApi): Promise<ApiResult<UnavailabilitiesListResponse>> {
        return runRequest(
          apiHandler.get<UnavailabilitiesListResponse>(`doctors/${doctorId}/unavailability`, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      providesTags: ["Unavailability"],
    }),
    deleteDoctorUnavailability: builder.mutation<DeleteResponse, string>({
      async queryFn(unavailabilityId, api: BaseQueryApi): Promise<ApiResult<DeleteResponse>> {
        return runRequest(
          apiHandler.delete<DeleteResponse>(`doctors/unavailability/${unavailabilityId}`, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Unavailability"],
    }),

    getPatientAppointments: builder.query<AppointmentsListResponse, { page?: number; limit?: number }>({
      async queryFn(
        { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
        api: BaseQueryApi
      ): Promise<ApiResult<AppointmentsListResponse>> {
        return runRequest(
          apiHandler.get<AppointmentsListResponse>("appointments/my", {
            token: (api.getState() as any).auth.token,
            params: { page, limit },
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    getAppointmentSlots: builder.query<
      AppointmentSlotsResponse,
      { doctorId: string; date: string; appointmentType?: "IN_PERSON" | "VIDEO" }
    >({
      async queryFn({ doctorId, date, appointmentType }, api: BaseQueryApi): Promise<ApiResult<AppointmentSlotsResponse>> {
        return runRequest(
          apiHandler.get<AppointmentSlotsResponse>("appointments/slots", {
            token: (api.getState() as any).auth.token,
            params: { doctorId, date, appointmentType },
          }),
          api
        );
      },
      providesTags: ["Availability"],
    }),
    getDoctorAppointments: builder.query<AppointmentsListResponse, { page?: number; limit?: number; search?: string; date?: string }>({
      async queryFn(
        { page = 1, limit = 10, search, date }: { page?: number; limit?: number; search?: string; date?: string } = {},
        api: BaseQueryApi
      ): Promise<ApiResult<AppointmentsListResponse>> {
        return runRequest(
          apiHandler.get<AppointmentsListResponse>("appointments/doctor/my", {
            token: (api.getState() as any).auth.token,
            params: { page, limit, search: search?.trim() || undefined, date },
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    getAdminAppointmentInsights: builder.query<AdminAppointmentInsightsResponse, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<AdminAppointmentInsightsResponse>> {
        return runRequest(
          apiHandler.get<AdminAppointmentInsightsResponse>("appointments/admin/insights", {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    getAdminAppointments: builder.query<AppointmentsListResponse, AdminAppointmentsQuery>({
      async queryFn(
        {
          page = 1,
          limit = 10,
          search = "",
          status,
          date,
        }: AdminAppointmentsQuery = {},
        api: BaseQueryApi
      ): Promise<ApiResult<AppointmentsListResponse>> {
        return runRequest(
          apiHandler.get<AppointmentsListResponse>("appointments/admin/all", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: {
              page,
              limit,
              search: search.trim() || undefined,
              status,
              date: date || undefined,
            },
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    createAppointment: builder.mutation<AppointmentCreateResponse, CreateAppointmentRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AppointmentCreateResponse>> {
        return runRequest(
          apiHandler.post<AppointmentCreateResponse>("appointments", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Appointment", "Availability"],
    }),
    cancelAppointment: builder.mutation<AppointmentMutationResponse, string>({
      async queryFn(id, api: BaseQueryApi): Promise<ApiResult<AppointmentMutationResponse>> {
        return runRequest(
          apiHandler.patch<AppointmentMutationResponse>(`appointments/${id}/cancel`, undefined, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Appointment", "Availability"],
    }),
    completeAppointment: builder.mutation<AppointmentMutationResponse, string>({
      async queryFn(id, api: BaseQueryApi): Promise<ApiResult<AppointmentMutationResponse>> {
        return runRequest(
          apiHandler.patch<AppointmentMutationResponse>(`appointments/${id}/complete`, undefined, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Appointment"],
    }),
    updateAppointmentByDoctor: builder.mutation<
      AppointmentMutationResponse,
      { id: string; data: UpdateAppointmentByDoctorRequest }
    >({
      async queryFn({ id, data }, api: BaseQueryApi): Promise<ApiResult<AppointmentMutationResponse>> {
        return runRequest(
          apiHandler.patch<AppointmentMutationResponse>(`appointments/${id}/doctor-update`, data, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Appointment"],
    }),

    predictWaitingTime: builder.mutation<unknown, WaitingTimePredictionRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/waiting-time", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
    }),
    predictResourceAllocation: builder.mutation<unknown, ResourceAllocationPredictionRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/resource-allocation", body, {
            token: (api.getState() as any).auth.token,
          }),
          api
        );
      },
    }),
    trainPredictionModel: builder.mutation<unknown, TrainModelRequest | void>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train", body ?? {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),
    reloadPredictionModel: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/reload", {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    // ── New prediction endpoints ──

    getSlotsAnalysis: builder.query<
      { message: string; data: SlotAnalysisResponse },
      { doctorId: string; date: string }
    >({
      async queryFn({ doctorId, date }, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ message: string; data: SlotAnalysisResponse }>("predictions/slots-analysis", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: { doctorId, date },
          }),
          api
        );
      },
    }),

    predictNoShow: builder.mutation<
      { message: string; data: NoShowPredictionResponse },
      NoShowPredictionRequest
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ message: string; data: NoShowPredictionResponse }>("predictions/no-show", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getSurgeryPlan: builder.mutation<
      { message: string; data: SurgeryPlanResponse },
      SurgeryPlanRequest
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ message: string; data: SurgeryPlanResponse }>("predictions/surgery-plan", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getPriceEstimation: builder.mutation<
      { message: string; data: PriceEstimationResponse },
      PriceEstimationRequest
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ message: string; data: PriceEstimationResponse }>("predictions/price-estimation", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getBedAvailability: builder.mutation<
      { message: string; data: BedAvailabilityResponse },
      BedAvailabilityRequest
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ message: string; data: BedAvailabilityResponse }>("predictions/bed-availability", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getQueueStatus: builder.query<
      { message: string; data: QueueStatusResponse },
      { doctorId: string }
    >({
      async queryFn({ doctorId }, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ message: string; data: QueueStatusResponse }>("predictions/queue-status", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: { doctorId },
          }),
          api
        );
      },
    }),

    getRecommendations: builder.query<
      { message: string; data: RecommendationsResponse },
      void
    >({
      async queryFn(_arg, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ message: string; data: RecommendationsResponse }>("predictions/recommendations", {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    trainNoShow: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train/no-show", {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    askAssistant: builder.mutation<AssistantResponse, AssistantRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AssistantResponse>> {
        return runRequest(
          apiHandler.post<AssistantResponse>("assistant", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    trainPrice: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train/price", {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    trainBed: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train/bed", {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getHospitalResources: builder.query<
      { status: boolean; data: any[]; total: number; page: number; totalPages: number; limit: number },
      { category?: string; search?: string; page?: number; limit?: number }
    >({
      async queryFn({ category, search, page = 1, limit = 10 } = {}, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ status: boolean; data: any[]; total: number; page: number; totalPages: number; limit: number }>("resources", {
            token: (api.getState() as ApiAuthState).auth.token,
            params: { category, search, page, limit },
          }),
          api
        );
      },
      providesTags: ["Resource"],
    }),

    createHospitalResource: builder.mutation<
      { status: boolean; data: any },
      { name: string; category: string; basePrice: number; description?: string, status?: string }
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ status: boolean; data: any }>("resources", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource" as any],
    }),

    updateHospitalResource: builder.mutation<
      { status: boolean; data: any },
      { id: string; status?: string; name?: string; basePrice?: number; description?: string }
    >({
      async queryFn({ id, ...body }, api: BaseQueryApi) {
        return runRequest(
          apiHandler.patch<{ status: boolean; data: any }>(`resources/${id}`, body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource" as any],
    }),

    deleteHospitalResource: builder.mutation<
      { status: boolean; message: string },
      string
    >({
      async queryFn(id, api: BaseQueryApi) {
        return runRequest(
          apiHandler.delete<{ status: boolean; message: string }>(`resources/${id}`, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource" as any],
    }),

    trainDisease: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train/disease", {}, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
    }),

    getHospitalResourceAllocations: builder.query<{ status: boolean; data: any[] }, void>({
      async queryFn(_arg, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ status: boolean; data: any[] }>("resources/allocations", {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      providesTags: ["Resource", "Appointment"],
    }),

    allocateHospitalResource: builder.mutation<
      { status: boolean; data: any },
      { resourceId: string; patientId: string; unitId: string; notes?: string }
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ status: boolean; data: any }>("resources/allocate", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource", "Appointment"],
    }),

    releaseHospitalResource: builder.mutation<
      { status: boolean; data: any },
      { allocationId: string }
    >({
      async queryFn(body, api: BaseQueryApi) {
        return runRequest(
          apiHandler.post<{ status: boolean; data: any }>("resources/release", body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource", "Appointment"],
    }),

    getResourceUnits: builder.query<
      { status: boolean; data: any[]; resourceName: string; category: string },
      string
    >({
      async queryFn(resourceId, api: BaseQueryApi) {
        return runRequest(
          apiHandler.get<{ status: boolean; data: any[]; resourceName: string; category: string }>(`resources/${resourceId}/units`, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      providesTags: ["Resource"],
    }),

    updateResourceUnit: builder.mutation<
      { status: boolean; data: any; summary: any },
      { unitId: string; isActive?: boolean; occupancyStatus?: string }
    >({
      async queryFn({ unitId, ...body }, api: BaseQueryApi) {
        return runRequest(
          apiHandler.patch<{ status: boolean; data: any; summary: any }>(`resources/units/${unitId}`, body, {
            token: (api.getState() as ApiAuthState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Resource"],
    }),

  }),
});

export const {
  useLoginPatientMutation,
  useLoginDoctorMutation,
  useLoginAdminMutation,
  useRegisterPatientMutation,
  useRegisterDoctorMutation,
  useGetDoctorsQuery,
  useGetAdminDoctorAnalyticsQuery,
  useGetAdminPatientsQuery,
  useGetDoctorByIdQuery,
  useGetDoctorProfileQuery,
  useCreateDoctorScheduleMutation,
  useGetDoctorSchedulesQuery,
  useUpdateDoctorScheduleMutation,
  useDeleteDoctorScheduleMutation,
  useAddDoctorUnavailabilityMutation,
  useGetDoctorUnavailabilitiesQuery,
  useDeleteDoctorUnavailabilityMutation,
  useGetDoctorAvailabilityQuery,
  useLazyGetDoctorAvailabilityQuery,
  useGetAppointmentSlotsQuery,
  useGetPatientAppointmentsQuery,
  useGetDoctorAppointmentsQuery,
  useGetAdminAppointmentInsightsQuery,
  useGetAdminAppointmentsQuery,
  useCreateAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useUpdateAppointmentByDoctorMutation,
  usePredictWaitingTimeMutation,
  usePredictResourceAllocationMutation,
  useTrainPredictionModelMutation,
  useReloadPredictionModelMutation,
  // New prediction hooks
  useGetSlotsAnalysisQuery,
  usePredictNoShowMutation,
  useGetSurgeryPlanMutation,
  useGetPriceEstimationMutation,
  useGetBedAvailabilityMutation,
  useGetQueueStatusQuery,
  useGetRecommendationsQuery,
  useTrainNoShowMutation,
  useTrainPriceMutation,
  useTrainBedMutation,
  useAskAssistantMutation,
  useGetHospitalResourcesQuery,
  useCreateHospitalResourceMutation,
  useUpdateHospitalResourceMutation,
  useDeleteHospitalResourceMutation,
  useTrainDiseaseMutation,
  useGetHospitalResourceAllocationsQuery,
  useAllocateHospitalResourceMutation,
  useReleaseHospitalResourceMutation,
  useGetResourceUnitsQuery,
  useLazyGetResourceUnitsQuery,
  useUpdateResourceUnitMutation,
} = api;

