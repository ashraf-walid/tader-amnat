// ─── ثوابت الأدوار ───────────────────────────────────────────────────────────
export const ROLES = [
  {
    value: "owner",
    label: "المالك",
    color: "#f0b429",
    bg: "rgba(240,180,41,0.12)",
  },
  {
    value: "admin",
    label: "مدير",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
  },
  {
    value: "employee",
    label: "موظف",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  {
    value: "client",
    label: "عميل",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
  },
];

export const getRoleInfo = (v) => ROLES.find((r) => r.value === v) || ROLES[3];

// ─── نموذج فارغ ─────────────────────────────────────────────────────────────
export const EMPTY_FORM = {
  username: "",
  password: "",
  phone: "",
  officeName: "",
  role: "client",
  attempts: 5,
  accountCode: "",
};
