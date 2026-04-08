export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatCompactCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const target = new Date(cleanDate + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };
  return map[stage] ?? stage;
}

export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    lead: "bg-slate-100 text-slate-700 border-slate-200",
    qualified: "bg-blue-50 text-blue-700 border-blue-200",
    proposal: "bg-violet-50 text-violet-700 border-violet-200",
    negotiation: "bg-amber-50 text-amber-700 border-amber-200",
    closed_won: "bg-green-50 text-green-700 border-green-200",
    closed_lost: "bg-red-50 text-red-700 border-red-200",
  };
  return map[stage] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function stageDotColor(stage: string): string {
  const map: Record<string, string> = {
    lead: "bg-slate-400",
    qualified: "bg-blue-500",
    proposal: "bg-violet-500",
    negotiation: "bg-amber-500",
    closed_won: "bg-green-500",
    closed_lost: "bg-red-500",
  };
  return map[stage] ?? "bg-gray-400";
}
