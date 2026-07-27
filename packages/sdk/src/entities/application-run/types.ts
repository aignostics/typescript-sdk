/** Derived run status that simplifies the raw `state` + `termination_reason` combination. */
export type RunStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'CANCELED'
  | 'FAILED'
  | 'UNKNOWN';
