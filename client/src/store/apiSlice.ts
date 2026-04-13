import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryApi } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { apiHandler, ApiHandlerError } from "@/lib/api/apiHandler";
import { clearAuthCookie } from "@/lib/auth";
import { logout, mapAuthUserDto, setCredentials } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import type {
  AddUnavailabilityRequest,
  AppointmentCreateResponse,
  AppointmentMutationResponse,
  AppointmentsListResponse,
  AuthResponse,
  CreateAppointmentRequest,
  CreateScheduleRequest,
  DeleteResponse,
  DoctorAvailabilityResponse,
  DoctorResponse,
  DoctorsListResponse,
  LoginRequest,
  RegisterDoctorRequest,
  RegisterPatientRequest,
  ResourceAllocationPredictionRequest,
  ScheduleDto,
  SchedulesListResponse,
  TrainModelRequest,
  UnavailabilitiesListResponse,
  UnavailabilityDto,
  UpdateScheduleRequest,
  UpdateAppointmentByDoctorRequest,
  WaitingTimePredictionRequest,
} from "@/types/api";

type ApiResult<T> =
  | { data: T }
  | { error: { status?: number; data: unknown } };

async function runRequest<T>(
  request: Promise<T>,
  api: BaseQueryApi,
  silent = false
): Promise<ApiResult<T>> {
  const token = (api.getState() as RootState).auth.token;

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
  tagTypes: ["Appointment", "Doctor", "DoctorProfile", "Schedule", "Unavailability", "Availability"],
  endpoints: (builder) => ({
    loginPatient: builder.mutation<AuthResponse, LoginRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/login", body, {
            token: (api.getState() as RootState).auth.token,
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
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    loginDoctor: builder.mutation<AuthResponse, LoginRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/doctor/login", body, {
            token: (api.getState() as RootState).auth.token,
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
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    registerPatient: builder.mutation<AuthResponse, RegisterPatientRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/register", body, {
            token: (api.getState() as RootState).auth.token,
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
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),
    registerDoctor: builder.mutation<AuthResponse, RegisterDoctorRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<AuthResponse>> {
        return runRequest(
          apiHandler.post<AuthResponse>("auth/doctor/register", body, {
            token: (api.getState() as RootState).auth.token,
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
        } catch {
          // Expected auth failures are handled by the shared API handler.
        }
      },
    }),

    getDoctors: builder.query<DoctorsListResponse, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<DoctorsListResponse>> {
        return runRequest(
          apiHandler.get<DoctorsListResponse>("doctors", {
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
      providesTags: ["Doctor"],
    }),
    getDoctorById: builder.query<DoctorResponse, string>({
      async queryFn(id, api: BaseQueryApi): Promise<ApiResult<DoctorResponse>> {
        return runRequest(
          apiHandler.get<DoctorResponse>(`doctors/${id}`, {
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
      invalidatesTags: ["Unavailability"],
    }),

    getPatientAppointments: builder.query<AppointmentsListResponse, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<AppointmentsListResponse>> {
        return runRequest(
          apiHandler.get<AppointmentsListResponse>("appointments/my", {
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
      providesTags: ["Appointment"],
    }),
    getDoctorAppointments: builder.query<AppointmentsListResponse, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<AppointmentsListResponse>> {
        return runRequest(
          apiHandler.get<AppointmentsListResponse>("appointments/doctor/my", {
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
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
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
    }),
    predictResourceAllocation: builder.mutation<unknown, ResourceAllocationPredictionRequest>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/resource-allocation", body, {
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
    }),
    trainPredictionModel: builder.mutation<unknown, TrainModelRequest | void>({
      async queryFn(body, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/train", body ?? {}, {
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
    }),
    reloadPredictionModel: builder.mutation<unknown, void>({
      async queryFn(_arg, api: BaseQueryApi): Promise<ApiResult<unknown>> {
        return runRequest(
          apiHandler.post<unknown>("predictions/reload", {}, {
            token: (api.getState() as RootState).auth.token,
          }),
          api
        );
      },
    }),
  }),
});

export const {
  useLoginPatientMutation,
  useLoginDoctorMutation,
  useRegisterPatientMutation,
  useRegisterDoctorMutation,
  useGetDoctorsQuery,
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
  useGetPatientAppointmentsQuery,
  useGetDoctorAppointmentsQuery,
  useCreateAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useUpdateAppointmentByDoctorMutation,
  usePredictWaitingTimeMutation,
  usePredictResourceAllocationMutation,
  useTrainPredictionModelMutation,
  useReloadPredictionModelMutation,
} = api;
