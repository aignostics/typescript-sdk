/** Derived item status that simplifies the raw `state` + `termination_reason` combination. */
export type ItemStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'UNKNOWN';
