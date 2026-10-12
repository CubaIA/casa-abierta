import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AccountStatus, AccountStatusInput, AccountSummary, AdminSummary, ConnectionRequest, ConnectionRequestInput, ConnectionRequestStatusInput, Experience, ExperienceUpdate, HealthStatus, ListAllConnectionRequestsParams, ListExperiencesParams, ListProviderApplicationsParams, ListReportsParams, Profile, ProviderApplication, ProviderApplicationInput, ProviderApplicationUpdate, ProviderDecision, Report, ReportInput, ReportReview, TravelPreferences, TravelPreferencesInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyProfileUrl: () => string;
/**
 * @summary Get the signed-in user's role and account status
 */
export declare const getMyProfile: (options?: Parameters<typeof customFetch>[1]) => Promise<Profile>;
export declare const getGetMyProfileQueryKey: () => readonly ["/api/profile/me"];
export declare const getGetMyProfileQueryOptions: <TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getMyProfile>>>;
export type GetMyProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get the signed-in user's role and account status
 */
export declare function useGetMyProfile<TData = Awaited<ReturnType<typeof getMyProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListExperiencesUrl: (params?: ListExperiencesParams) => string;
/**
 * @summary List approved experiences
 */
export declare const listExperiences: (params?: ListExperiencesParams, options?: Parameters<typeof customFetch>[1]) => Promise<Experience[]>;
export declare const getListExperiencesQueryKey: (params?: ListExperiencesParams) => readonly ["/api/experiences", ...ListExperiencesParams[]];
export declare const getListExperiencesQueryOptions: <TData = Awaited<ReturnType<typeof listExperiences>>, TError = ErrorType<unknown>>(params?: ListExperiencesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExperiences>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listExperiences>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListExperiencesQueryResult = NonNullable<Awaited<ReturnType<typeof listExperiences>>>;
export type ListExperiencesQueryError = ErrorType<unknown>;
/**
 * @summary List approved experiences
 */
export declare function useListExperiences<TData = Awaited<ReturnType<typeof listExperiences>>, TError = ErrorType<unknown>>(params?: ListExperiencesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listExperiences>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetExperienceUrl: (id: string) => string;
/**
 * @summary Get one approved experience
 */
export declare const getExperience: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<Experience>;
export declare const getGetExperienceQueryKey: (id: string) => readonly [`/api/experiences/${string}`];
export declare const getGetExperienceQueryOptions: <TData = Awaited<ReturnType<typeof getExperience>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExperience>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExperience>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExperienceQueryResult = NonNullable<Awaited<ReturnType<typeof getExperience>>>;
export type GetExperienceQueryError = ErrorType<void>;
/**
 * @summary Get one approved experience
 */
export declare function useGetExperience<TData = Awaited<ReturnType<typeof getExperience>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExperience>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateProviderApplicationUrl: () => string;
/**
 * @summary Submit a provider profile for review
 */
export declare const createProviderApplication: (providerApplicationInput: ProviderApplicationInput, options?: Parameters<typeof customFetch>[1]) => Promise<ProviderApplication>;
export declare const getCreateProviderApplicationMutationKey: () => readonly ["createProviderApplication"];
export declare const getCreateProviderApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProviderApplication>>, TError, CreateProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProviderApplication>>, TError, CreateProviderApplicationMutationVariables, TContext>;
export type CreateProviderApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof createProviderApplication>>>;
export type CreateProviderApplicationMutationBody = BodyType<ProviderApplicationInput>;
export type CreateProviderApplicationMutationError = ErrorType<unknown>;
export type CreateProviderApplicationMutationVariables = {
    data: BodyType<ProviderApplicationInput>;
};
/**
* @summary Submit a provider profile for review
*/
export declare const useCreateProviderApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProviderApplication>>, TError, CreateProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProviderApplication>>, TError, CreateProviderApplicationMutationVariables, TContext>;
export declare const getGetMyProviderApplicationUrl: () => string;
/**
 * @summary Get the signed-in provider's application
 */
export declare const getMyProviderApplication: (options?: Parameters<typeof customFetch>[1]) => Promise<ProviderApplication | null>;
export declare const getGetMyProviderApplicationQueryKey: () => readonly ["/api/provider-applications"];
export declare const getGetMyProviderApplicationQueryOptions: <TData = Awaited<ReturnType<typeof getMyProviderApplication>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProviderApplication>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyProviderApplication>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyProviderApplicationQueryResult = NonNullable<Awaited<ReturnType<typeof getMyProviderApplication>>>;
export type GetMyProviderApplicationQueryError = ErrorType<unknown>;
/**
 * @summary Get the signed-in provider's application
 */
export declare function useGetMyProviderApplication<TData = Awaited<ReturnType<typeof getMyProviderApplication>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProviderApplication>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProviderApplicationUrl: (id: string) => string;
/**
 * @summary Update a pending provider application
 */
export declare const updateProviderApplication: (id: string, providerApplicationUpdate: ProviderApplicationUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<ProviderApplication>;
export declare const getUpdateProviderApplicationMutationKey: () => readonly ["updateProviderApplication"];
export declare const getUpdateProviderApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProviderApplication>>, TError, UpdateProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProviderApplication>>, TError, UpdateProviderApplicationMutationVariables, TContext>;
export type UpdateProviderApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof updateProviderApplication>>>;
export type UpdateProviderApplicationMutationBody = BodyType<ProviderApplicationUpdate>;
export type UpdateProviderApplicationMutationError = ErrorType<unknown>;
export type UpdateProviderApplicationMutationVariables = {
    id: string;
    data: BodyType<ProviderApplicationUpdate>;
};
/**
* @summary Update a pending provider application
*/
export declare const useUpdateProviderApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProviderApplication>>, TError, UpdateProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProviderApplication>>, TError, UpdateProviderApplicationMutationVariables, TContext>;
export declare const getListProviderApplicationsUrl: (params?: ListProviderApplicationsParams) => string;
/**
 * @summary List applications for moderation
 */
export declare const listProviderApplications: (params?: ListProviderApplicationsParams, options?: Parameters<typeof customFetch>[1]) => Promise<ProviderApplication[]>;
export declare const getListProviderApplicationsQueryKey: (params?: ListProviderApplicationsParams) => readonly ["/api/admin/provider-applications", ...ListProviderApplicationsParams[]];
export declare const getListProviderApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listProviderApplications>>, TError = ErrorType<unknown>>(params?: ListProviderApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderApplications>>>;
export type ListProviderApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List applications for moderation
 */
export declare function useListProviderApplications<TData = Awaited<ReturnType<typeof listProviderApplications>>, TError = ErrorType<unknown>>(params?: ListProviderApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDecideProviderApplicationUrl: (id: string) => string;
/**
 * @summary Approve, reject, or suspend a provider
 */
export declare const decideProviderApplication: (id: string, providerDecision: ProviderDecision, options?: Parameters<typeof customFetch>[1]) => Promise<ProviderApplication>;
export declare const getDecideProviderApplicationMutationKey: () => readonly ["decideProviderApplication"];
export declare const getDecideProviderApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decideProviderApplication>>, TError, DecideProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof decideProviderApplication>>, TError, DecideProviderApplicationMutationVariables, TContext>;
export type DecideProviderApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof decideProviderApplication>>>;
export type DecideProviderApplicationMutationBody = BodyType<ProviderDecision>;
export type DecideProviderApplicationMutationError = ErrorType<unknown>;
export type DecideProviderApplicationMutationVariables = {
    id: string;
    data: BodyType<ProviderDecision>;
};
/**
* @summary Approve, reject, or suspend a provider
*/
export declare const useDecideProviderApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decideProviderApplication>>, TError, DecideProviderApplicationMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof decideProviderApplication>>, TError, DecideProviderApplicationMutationVariables, TContext>;
export declare const getUpdateExperienceUrl: (id: string) => string;
/**
 * @summary Edit or hide a published experience
 */
export declare const updateExperience: (id: string, experienceUpdate: ExperienceUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Experience>;
export declare const getUpdateExperienceMutationKey: () => readonly ["updateExperience"];
export declare const getUpdateExperienceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateExperience>>, TError, UpdateExperienceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateExperience>>, TError, UpdateExperienceMutationVariables, TContext>;
export type UpdateExperienceMutationResult = NonNullable<Awaited<ReturnType<typeof updateExperience>>>;
export type UpdateExperienceMutationBody = BodyType<ExperienceUpdate>;
export type UpdateExperienceMutationError = ErrorType<unknown>;
export type UpdateExperienceMutationVariables = {
    id: string;
    data: BodyType<ExperienceUpdate>;
};
/**
* @summary Edit or hide a published experience
*/
export declare const useUpdateExperience: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateExperience>>, TError, UpdateExperienceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateExperience>>, TError, UpdateExperienceMutationVariables, TContext>;
export declare const getListAllConnectionRequestsUrl: (params?: ListAllConnectionRequestsParams) => string;
/**
 * @summary List connection requests for moderation
 */
export declare const listAllConnectionRequests: (params?: ListAllConnectionRequestsParams, options?: Parameters<typeof customFetch>[1]) => Promise<ConnectionRequest[]>;
export declare const getListAllConnectionRequestsQueryKey: (params?: ListAllConnectionRequestsParams) => readonly ["/api/admin/connection-requests", ...ListAllConnectionRequestsParams[]];
export declare const getListAllConnectionRequestsQueryOptions: <TData = Awaited<ReturnType<typeof listAllConnectionRequests>>, TError = ErrorType<unknown>>(params?: ListAllConnectionRequestsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllConnectionRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAllConnectionRequests>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAllConnectionRequestsQueryResult = NonNullable<Awaited<ReturnType<typeof listAllConnectionRequests>>>;
export type ListAllConnectionRequestsQueryError = ErrorType<unknown>;
/**
 * @summary List connection requests for moderation
 */
export declare function useListAllConnectionRequests<TData = Awaited<ReturnType<typeof listAllConnectionRequests>>, TError = ErrorType<unknown>>(params?: ListAllConnectionRequestsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllConnectionRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAccountStatusUrl: (id: string) => string;
/**
 * @summary Suspend or restore an account
 */
export declare const updateAccountStatus: (id: string, accountStatusInput: AccountStatusInput, options?: Parameters<typeof customFetch>[1]) => Promise<AccountStatus>;
export declare const getUpdateAccountStatusMutationKey: () => readonly ["updateAccountStatus"];
export declare const getUpdateAccountStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAccountStatus>>, TError, UpdateAccountStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAccountStatus>>, TError, UpdateAccountStatusMutationVariables, TContext>;
export type UpdateAccountStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateAccountStatus>>>;
export type UpdateAccountStatusMutationBody = BodyType<AccountStatusInput>;
export type UpdateAccountStatusMutationError = ErrorType<unknown>;
export type UpdateAccountStatusMutationVariables = {
    id: string;
    data: BodyType<AccountStatusInput>;
};
/**
* @summary Suspend or restore an account
*/
export declare const useUpdateAccountStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAccountStatus>>, TError, UpdateAccountStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAccountStatus>>, TError, UpdateAccountStatusMutationVariables, TContext>;
export declare const getListAccountsUrl: () => string;
/**
 * @summary List accounts for trust and safety management
 */
export declare const listAccounts: (options?: Parameters<typeof customFetch>[1]) => Promise<AccountSummary[]>;
export declare const getListAccountsQueryKey: () => readonly ["/api/admin/users"];
export declare const getListAccountsQueryOptions: <TData = Awaited<ReturnType<typeof listAccounts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAccounts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAccounts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAccountsQueryResult = NonNullable<Awaited<ReturnType<typeof listAccounts>>>;
export type ListAccountsQueryError = ErrorType<unknown>;
/**
 * @summary List accounts for trust and safety management
 */
export declare function useListAccounts<TData = Awaited<ReturnType<typeof listAccounts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAccounts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateConnectionRequestUrl: () => string;
/**
 * @summary Request an introduction to a local provider
 */
export declare const createConnectionRequest: (connectionRequestInput: ConnectionRequestInput, options?: Parameters<typeof customFetch>[1]) => Promise<ConnectionRequest>;
export declare const getCreateConnectionRequestMutationKey: () => readonly ["createConnectionRequest"];
export declare const getCreateConnectionRequestMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConnectionRequest>>, TError, CreateConnectionRequestMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createConnectionRequest>>, TError, CreateConnectionRequestMutationVariables, TContext>;
export type CreateConnectionRequestMutationResult = NonNullable<Awaited<ReturnType<typeof createConnectionRequest>>>;
export type CreateConnectionRequestMutationBody = BodyType<ConnectionRequestInput>;
export type CreateConnectionRequestMutationError = ErrorType<unknown>;
export type CreateConnectionRequestMutationVariables = {
    data: BodyType<ConnectionRequestInput>;
};
/**
* @summary Request an introduction to a local provider
*/
export declare const useCreateConnectionRequest: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConnectionRequest>>, TError, CreateConnectionRequestMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createConnectionRequest>>, TError, CreateConnectionRequestMutationVariables, TContext>;
export declare const getListMyConnectionRequestsUrl: () => string;
/**
 * @summary List requests visible to the signed-in user
 */
export declare const listMyConnectionRequests: (options?: Parameters<typeof customFetch>[1]) => Promise<ConnectionRequest[]>;
export declare const getListMyConnectionRequestsQueryKey: () => readonly ["/api/connection-requests"];
export declare const getListMyConnectionRequestsQueryOptions: <TData = Awaited<ReturnType<typeof listMyConnectionRequests>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyConnectionRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMyConnectionRequests>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMyConnectionRequestsQueryResult = NonNullable<Awaited<ReturnType<typeof listMyConnectionRequests>>>;
export type ListMyConnectionRequestsQueryError = ErrorType<unknown>;
/**
 * @summary List requests visible to the signed-in user
 */
export declare function useListMyConnectionRequests<TData = Awaited<ReturnType<typeof listMyConnectionRequests>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyConnectionRequests>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateConnectionRequestStatusUrl: (id: string) => string;
/**
 * @summary Update a request as its provider or an administrator
 */
export declare const updateConnectionRequestStatus: (id: string, connectionRequestStatusInput: ConnectionRequestStatusInput, options?: Parameters<typeof customFetch>[1]) => Promise<ConnectionRequest>;
export declare const getUpdateConnectionRequestStatusMutationKey: () => readonly ["updateConnectionRequestStatus"];
export declare const getUpdateConnectionRequestStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateConnectionRequestStatus>>, TError, UpdateConnectionRequestStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateConnectionRequestStatus>>, TError, UpdateConnectionRequestStatusMutationVariables, TContext>;
export type UpdateConnectionRequestStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateConnectionRequestStatus>>>;
export type UpdateConnectionRequestStatusMutationBody = BodyType<ConnectionRequestStatusInput>;
export type UpdateConnectionRequestStatusMutationError = ErrorType<unknown>;
export type UpdateConnectionRequestStatusMutationVariables = {
    id: string;
    data: BodyType<ConnectionRequestStatusInput>;
};
/**
* @summary Update a request as its provider or an administrator
*/
export declare const useUpdateConnectionRequestStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateConnectionRequestStatus>>, TError, UpdateConnectionRequestStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateConnectionRequestStatus>>, TError, UpdateConnectionRequestStatusMutationVariables, TContext>;
export declare const getCreateReportUrl: () => string;
/**
 * @summary Report a provider or listing
 */
export declare const createReport: (reportInput: ReportInput, options?: Parameters<typeof customFetch>[1]) => Promise<Report>;
export declare const getCreateReportMutationKey: () => readonly ["createReport"];
export declare const getCreateReportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, CreateReportMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, CreateReportMutationVariables, TContext>;
export type CreateReportMutationResult = NonNullable<Awaited<ReturnType<typeof createReport>>>;
export type CreateReportMutationBody = BodyType<ReportInput>;
export type CreateReportMutationError = ErrorType<unknown>;
export type CreateReportMutationVariables = {
    data: BodyType<ReportInput>;
};
/**
* @summary Report a provider or listing
*/
export declare const useCreateReport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createReport>>, TError, CreateReportMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createReport>>, TError, CreateReportMutationVariables, TContext>;
export declare const getListReportsUrl: (params?: ListReportsParams) => string;
/**
 * @summary List trust and safety reports
 */
export declare const listReports: (params?: ListReportsParams, options?: Parameters<typeof customFetch>[1]) => Promise<Report[]>;
export declare const getListReportsQueryKey: (params?: ListReportsParams) => readonly ["/api/admin/reports", ...ListReportsParams[]];
export declare const getListReportsQueryOptions: <TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReportsQueryResult = NonNullable<Awaited<ReturnType<typeof listReports>>>;
export type ListReportsQueryError = ErrorType<unknown>;
/**
 * @summary List trust and safety reports
 */
export declare function useListReports<TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getReviewReportUrl: (id: string) => string;
/**
 * @summary Update a report's moderation outcome
 */
export declare const reviewReport: (id: string, reportReview: ReportReview, options?: Parameters<typeof customFetch>[1]) => Promise<Report>;
export declare const getReviewReportMutationKey: () => readonly ["reviewReport"];
export declare const getReviewReportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reviewReport>>, TError, ReviewReportMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof reviewReport>>, TError, ReviewReportMutationVariables, TContext>;
export type ReviewReportMutationResult = NonNullable<Awaited<ReturnType<typeof reviewReport>>>;
export type ReviewReportMutationBody = BodyType<ReportReview>;
export type ReviewReportMutationError = ErrorType<unknown>;
export type ReviewReportMutationVariables = {
    id: string;
    data: BodyType<ReportReview>;
};
/**
* @summary Update a report's moderation outcome
*/
export declare const useReviewReport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof reviewReport>>, TError, ReviewReportMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof reviewReport>>, TError, ReviewReportMutationVariables, TContext>;
export declare const getGetAdminSummaryUrl: () => string;
/**
 * @summary Get review queue counts
 */
export declare const getAdminSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<AdminSummary>;
export declare const getGetAdminSummaryQueryKey: () => readonly ["/api/admin/summary"];
export declare const getGetAdminSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminSummary>>>;
export type GetAdminSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get review queue counts
 */
export declare function useGetAdminSummary<TData = Awaited<ReturnType<typeof getAdminSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyPreferencesUrl: () => string;
/**
 * @summary Get the signed-in traveler's preferences
 */
export declare const getMyPreferences: (options?: Parameters<typeof customFetch>[1]) => Promise<TravelPreferences>;
export declare const getGetMyPreferencesQueryKey: () => readonly ["/api/preferences/me"];
export declare const getGetMyPreferencesQueryOptions: <TData = Awaited<ReturnType<typeof getMyPreferences>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPreferences>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyPreferences>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyPreferencesQueryResult = NonNullable<Awaited<ReturnType<typeof getMyPreferences>>>;
export type GetMyPreferencesQueryError = ErrorType<unknown>;
/**
 * @summary Get the signed-in traveler's preferences
 */
export declare function useGetMyPreferences<TData = Awaited<ReturnType<typeof getMyPreferences>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPreferences>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMyPreferencesUrl: () => string;
/**
 * @summary Save the signed-in traveler's preferences
 */
export declare const updateMyPreferences: (travelPreferencesInput: TravelPreferencesInput, options?: Parameters<typeof customFetch>[1]) => Promise<TravelPreferences>;
export declare const getUpdateMyPreferencesMutationKey: () => readonly ["updateMyPreferences"];
export declare const getUpdateMyPreferencesMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyPreferences>>, TError, UpdateMyPreferencesMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMyPreferences>>, TError, UpdateMyPreferencesMutationVariables, TContext>;
export type UpdateMyPreferencesMutationResult = NonNullable<Awaited<ReturnType<typeof updateMyPreferences>>>;
export type UpdateMyPreferencesMutationBody = BodyType<TravelPreferencesInput>;
export type UpdateMyPreferencesMutationError = ErrorType<unknown>;
export type UpdateMyPreferencesMutationVariables = {
    data: BodyType<TravelPreferencesInput>;
};
/**
* @summary Save the signed-in traveler's preferences
*/
export declare const useUpdateMyPreferences: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyPreferences>>, TError, UpdateMyPreferencesMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMyPreferences>>, TError, UpdateMyPreferencesMutationVariables, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map