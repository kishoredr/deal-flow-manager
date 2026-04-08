import { useGetPipelineSummary, useGetClosingSoonDeals, useListOwners } from "@workspace/api-client-react";
import { formatCurrency, formatDate, stageLabel, stageColor, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { TrendingUp, DollarSign, Award, Target, Clock, ChevronRight } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0", accent ?? "bg-primary/10")}>
        <Icon size={18} className={accent ? "text-white" : "text-primary"} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetPipelineSummary();
  const { data: closingSoon, isLoading: loadingClosing } = useGetClosingSoonDeals();
  const { data: owners } = useListOwners();

  const ownerMap = new Map(owners?.map((o) => [o.id, o.name]) ?? []);

  if (loadingSummary) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const winRatePct = summary ? Math.round(summary.winRate * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Pipeline overview at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Pipeline"
          value={formatCurrency(summary?.activeValue ?? 0)}
          sub={`${summary?.activeDeals ?? 0} open deals`}
          icon={TrendingUp}
        />
        <StatCard
          label="Won Revenue"
          value={formatCurrency(summary?.wonValue ?? 0)}
          sub="closed won"
          icon={DollarSign}
          accent="bg-green-500"
        />
        <StatCard
          label="Win Rate"
          value={`${winRatePct}%`}
          sub="won / (won + lost)"
          icon={Award}
          accent={winRatePct >= 50 ? "bg-green-500" : "bg-amber-500"}
        />
        <StatCard
          label="Avg Deal Value"
          value={formatCurrency(summary?.avgDealValue ?? 0)}
          sub={`across ${summary?.totalDeals ?? 0} deals`}
          icon={Target}
        />
      </div>

      {/* Closing soon */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="font-semibold text-sm">Closing in 30 Days</h2>
          </div>
          <Link href="/deals">
            <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
              All deals <ChevronRight size={12} />
            </span>
          </Link>
        </div>

        {loadingClosing ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : !closingSoon?.length ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No deals closing in the next 30 days
          </div>
        ) : (
          <div className="divide-y divide-border">
            {closingSoon.map((deal) => {
              const days = daysUntil(deal.expectedCloseDate);
              return (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.companyName} · {deal.ownerName}</p>
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", stageColor(deal.stage))}>
                      {stageLabel(deal.stage)}
                    </span>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(deal.value)}</p>
                      <p className={cn("text-xs", days <= 7 ? "text-red-500 font-medium" : "text-muted-foreground")}>
                        {days === 0 ? "Today" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
