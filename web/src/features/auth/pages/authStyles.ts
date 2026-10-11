export const authStyles = {
  heading: 'mb-6',
  center: 'text-center',
  title:
    'mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-ink',
  subtitle: 'text-sm leading-5 text-ink-muted',
  form: 'flex flex-col gap-4',
  formReset: 'flex flex-col gap-5',
  social: 'mb-6',
  formError: 'mb-4 rounded-[10px]',
  footerText: 'mt-6 text-center text-sm text-ink-muted',
  footerBox:
    'mt-6 pt-5 border-t border-border-subtle text-center text-sm text-ink-muted',
  legal: 'my-4 text-center text-xs leading-5 text-ink-muted',
  link: 'font-medium text-primary hover:text-primary-hover',
  backRow: 'mt-6 text-center text-sm text-ink-secondary',
  backLink:
    'inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink',
  actions: 'mt-2',
  actionsFlush: 'mt-0',
  successIcon:
    'inline-flex items-center justify-center size-10 mb-4 rounded-full bg-success-surface border border-success-border text-success',
  infoBox:
    'mb-6 p-4 bg-surface-subtle border border-border rounded-[10px] text-xs leading-[1.375rem] text-ink-muted',
  infoBoxTitle: 'flex items-start gap-1.5 mb-1 font-medium text-ink-secondary',
  infoBoxNote: 'block mt-0.5 font-mono text-[0.6875rem] text-ink-muted',
  changeInfoBox:
    'flex items-start gap-2.5 mb-5 p-3 border border-border rounded-[10px] bg-surface-muted text-xs leading-[1.125rem] text-ink-secondary',
  changeInfoIcon: 'shrink-0 mt-0.5 text-primary',
  changeInfoBoxText: 'flex-1 leading-normal',
  dangerBox:
    'mb-6 p-4 bg-danger-surface border border-danger-border rounded-[10px] text-xs leading-[1.375rem] text-danger-text',
  dangerBoxTitle: 'flex items-start gap-1.5 mb-1 font-semibold text-danger-text',
  dangerBoxNote: 'block mt-1 text-ink-muted',
  strong: 'font-medium text-ink',
  buttonStack: 'flex flex-col gap-2.5',
  confirmPasswordInput: 'relative',
  confirmPasswordField: 'pr-10',
  confirmPasswordCheck:
    'absolute right-2.5 text-success pointer-events-none',
  cancelRow: 'mt-3 text-center',
} as const
