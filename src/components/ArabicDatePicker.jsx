'use client';

/**
 * ArabicDatePicker
 * تثبيت: npm install react-datepicker date-fns
 */

import DatePicker, { registerLocale } from "react-datepicker";
import { ar } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("ar", ar);

const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

const PICKER_CSS = `
  .adp-wrap { position:relative; }

  .adp-wrap .react-datepicker-wrapper,
  .adp-wrap .react-datepicker__input-container { width:100%; }

  .adp-wrap .react-datepicker__input-container input {
    font-family:'Alexandria',system-ui,sans-serif;
    font-size:15px; font-weight:500;
    padding:13px 14px 13px 40px;
    border-radius:12px;
    border:1.5px solid var(--brd,rgba(255,255,255,0.12));
    background:var(--inp,#1a2035);
    color:var(--txt,#f0f2f8);
    width:100%; text-align:right; direction:rtl;
    outline:none; cursor:pointer;
    transition:border-color .15s,box-shadow .15s;
    -webkit-appearance:none;
  }
  .adp-wrap .react-datepicker__input-container input:focus {
    border-color:var(--acc,#f0b429);
    box-shadow:0 0 0 3px rgba(240,180,41,.18);
  }
  .adp-wrap .react-datepicker__input-container input::placeholder { color:var(--muted,#4a5568); }

  .adp-icon {
    position:absolute; left:13px; top:50%; transform:translateY(-50%);
    color:var(--muted,#4a5568); pointer-events:none; z-index:2;
    display:flex; align-items:center;
    transition:color .15s;
  }
  .adp-wrap:focus-within .adp-icon { color:var(--acc,#f0b429); }

  .adp-popper { z-index:9999; direction:rtl; }
  .adp-popper .react-datepicker {
    font-family:'Alexandria',system-ui,sans-serif;
    background:#131929; border:1px solid rgba(255,255,255,0.1);
    border-radius:16px; overflow:hidden;
    box-shadow:0 16px 48px rgba(0,0,0,.6);
    direction:rtl; padding:4px;
  }
  .adp-popper .react-datepicker__header {
    background:#0d1525; border-bottom:1px solid rgba(255,255,255,0.06);
    padding:12px 8px 8px; border-radius:12px 12px 0 0;
  }
  .adp-popper .react-datepicker__current-month {
    color:#f0f2f8; font-size:14px; font-weight:700;
  }
  .adp-popper .react-datepicker__navigation { top:13px; }
  .adp-popper .react-datepicker__navigation--previous { right:8px; left:auto; }
  .adp-popper .react-datepicker__navigation--next    { left:8px;  right:auto; }
  .adp-popper .react-datepicker__navigation-icon::before { border-color:#4a5568; }
  .adp-popper .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color:#f0b429; }
  .adp-popper .react-datepicker__day-name { color:#4a5568; font-size:11px; font-weight:700; width:2.1rem; line-height:2.1rem; margin:1px; }
  .adp-popper .react-datepicker__day {
    color:#c8cfe0; font-size:13px; width:2.1rem; line-height:2.1rem;
    border-radius:8px; margin:1px; transition:background .1s,color .1s;
  }
  .adp-popper .react-datepicker__day:hover { background:rgba(240,180,41,.15); color:#f0b429; }
  .adp-popper .react-datepicker__day--selected,
  .adp-popper .react-datepicker__day--keyboard-selected {
    background:#f0b429!important; color:#0d1525!important; font-weight:800; border-radius:8px;
  }
  .adp-popper .react-datepicker__day--today { color:#f0b429; font-weight:700; }
  .adp-popper .react-datepicker__day--today.react-datepicker__day--selected { color:#0d1525!important; }
  .adp-popper .react-datepicker__day--outside-month { color:rgba(255,255,255,.18); }
  .adp-popper .react-datepicker__day--disabled { color:rgba(255,255,255,.12)!important; cursor:not-allowed; }
  .adp-popper .react-datepicker__triangle { display:none; }
  .adp-popper .react-datepicker__month-container { padding:4px 4px 8px; }
  .adp-popper .react-datepicker__month { margin:2px; }
  .adp-popper .react-datepicker__week { display:flex; justify-content:center; }
`;

function InjectPickerCSS() {
  if (typeof document !== 'undefined' && !document.getElementById('adp-css')) {
    const s = document.createElement('style');
    s.id = 'adp-css'; s.textContent = PICKER_CSS;
    document.head.appendChild(s);
  }
  return null;
}

function CalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2.5" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 6.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="4"  y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
      <rect x="7"  y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
      <rect x="10" y="9" width="2" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function CustomHeader({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) {
  const btnStyle = (disabled) => ({
    background:'none', border:'none', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'rgba(255,255,255,.15)' : '#4a5568',
    fontSize:20, padding:'2px 10px', borderRadius:7,
    transition:'color .15s', lineHeight:1,
  });
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2px 4px',direction:'rtl'}}>
      <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} style={btnStyle(nextMonthButtonDisabled)}
        onMouseEnter={e=>{ if(!nextMonthButtonDisabled) e.target.style.color='#f0b429'; }}
        onMouseLeave={e=>{ e.target.style.color=nextMonthButtonDisabled?'rgba(255,255,255,.15)':'#4a5568'; }}>‹</button>
      <span style={{color:'#f0f2f8',fontWeight:700,fontSize:14}}>
        {MONTHS_AR[date.getMonth()]} {date.getFullYear()}
      </span>
      <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} style={btnStyle(prevMonthButtonDisabled)}
        onMouseEnter={e=>{ if(!prevMonthButtonDisabled) e.target.style.color='#f0b429'; }}
        onMouseLeave={e=>{ e.target.style.color=prevMonthButtonDisabled?'rgba(255,255,255,.15)':'#4a5568'; }}>›</button>
    </div>
  );
}

export default function ArabicDatePicker({ selected, onChange, label, placeholderText='يوم / شهر / سنة', minDate, maxDate, id, portalId }) {
  return (
    <>
      <InjectPickerCSS />
      <div>
        {label && <div style={{fontSize:11,fontWeight:600,color:'var(--muted,#4a5568)',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:7,direction:'rtl'}}>{label}</div>}
        <div className="adp-wrap">
          <span className="adp-icon"><CalIcon /></span>
          <DatePicker
            id={id} selected={selected} onChange={onChange}
            dateFormat="dd/MM/yyyy" locale="ar"
            placeholderText={placeholderText}
            minDate={minDate} maxDate={maxDate}
            popperClassName="adp-popper"
            portalId={portalId}
            renderCustomHeader={CustomHeader}
            showPopperArrow={false} autoComplete="off"
            onFocus={(e) => {
              if (window.innerWidth < 1024) {
                e.target.blur();
              }
            }}
          />
        </div>
      </div>
    </>
  );
}