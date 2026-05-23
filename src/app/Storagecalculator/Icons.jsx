export const EditIcon = ({ className, ...props }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <path d="M11 2l3 3L5 14H2v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon = ({ className, ...props }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const OptionsIcon = ({ className, ...props }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CheckIcon = ({ className, ...props }) => (
  <svg className={`sc2-chk-ico ${className || ''}`} width="11" height="9" viewBox="0 0 11 9" fill="none" {...props}>
    <path d="M1 4L4 7.5L10 1" stroke="#0b1120" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SummaryIcon = ({ className, ...props }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} {...props}>
    <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
