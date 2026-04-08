import {
  useGetDealsByStage,
  useGetDealsByOwner,
  useGetPipelineSummary,
} from "@workspace/api-client-react";
import { formatCurrency, stageLabel, stageDotColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function Pipeline() {
  const { data: byStage, isLoading: loadingStage } = useGetDealsByStage();
  const { data: byOwner, isLoading: loadingOwner } = useGetDealsByOwner();
  const { data: summary } = useGetPipelineSummary();

  const maxStageValue = Math.max(...(byStage?.map((s) => s.totalValue) ?? [1]), 1);
  const maxOwnerValue = Math.max(...(byOwner?.map((o) => o.totalValue) ?? [1]), 1);

  const stageColors: Record<string, string> = {
    lead: "bg-slate-400",
    qualified: "bg-blue-500",
    proposal: "bg-violet-500",
    negotiation: "bg-amber-500",
    closed_won: "bg-green-500",
    closed_lost: "bg-red-500",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Breakdown by stage and owner</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Stage */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Deals by Stage</h2>
            {summary && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.totalDeals} total · {formatCurrency(summary.totalValue)} pipeline
              </p>
            )}
          </div>
          {loadingStage ? (
            <div className="p-5 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {STAGES.map((stage) => {
                const data = byStage?.find((s) => s.stage === stage);
                const count = data?.count ?? 0;
                const value = data?.totalValue ?? 0;
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", stageColors[stage])} />
                        <span className="text-sm font-medium">{stageLabel(stage)}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(value)}</span>
                    </div>
                    <ProgressBar value={value} max={maxStageValue} color={stageColors[stage]} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Owner */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Deals by Owner</h2>
            {summary && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Performance across {byOwner?.length ?? 0} team members
              </p>
            )}
          </div>
          {loadingOwner ? (
            <div className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          ) : !byOwner?.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No owners yet</div>
          ) : (
            <div className="p-5 space-y-5">
              {[...byOwner].sort((a, b) => b.totalValue - a.totalValue).map((owner, idx) => (
                <div key={owner.ownerId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                        {owner.ownerName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{owner.ownerName}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{owner.count}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(owner.totalValue)}</span>
                  </div>
                  <ProgressBar
                    value={owner.totalValue}
                    max={maxOwnerValue}
                    color={["bg-primary", "bg-violet-500", "bg-amber-500"][idx % 3]}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Win rate card */}
      {summary && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-4">Funnel Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-foreground">{summary.totalDeals}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-green-600">{formatCurrency(summary.wonValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Won Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-red-500">{formatCurrency(summary.lostValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Lost Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-primary">{Math.round(summary.winRate * 100)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
