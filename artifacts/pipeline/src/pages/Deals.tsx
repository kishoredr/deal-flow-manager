import { useState } from "react";
import {
  useListDeals,
  useListOwners,
  useCreateDeal,
  useDeleteDeal,
  getListDealsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, stageLabel, stageColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DealForm from "@/components/DealForm";
import { Link } from "wouter";
import { Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;

export default function Deals() {
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    ...(stageFilter !== "all" ? { stage: stageFilter as typeof STAGES[number] } : {}),
    ...(ownerFilter !== "all" ? { ownerId: parseInt(ownerFilter) } : {}),
  };

  const { data: deals, isLoading } = useListDeals(params, { query: { queryKey: getListDealsQueryKey(params) } });
  const { data: owners } = useListOwners();
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();

  const filtered = (deals ?? []).filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.companyName.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate(data: any) {
    createDeal.mutate(
      { data: { ...data, notes: data.notes ?? null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          setCreateOpen(false);
          toast({ title: "Deal created" });
        },
        onError: () => toast({ title: "Failed to create deal", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteDeal.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          setDeleteId(null);
          toast({ title: "Deal deleted" });
        },
        onError: () => toast({ title: "Failed to delete deal", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} deal{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus size={15} /> New Deal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {(owners ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {search || stageFilter !== "all" || ownerFilter !== "all"
              ? "No deals match your filters"
              : "No deals yet — create your first deal"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Deal</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Stage</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Owner</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden lg:table-cell">Close Date</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((deal) => (
                  <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/deals/${deal.id}`}>
                        <span className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">{deal.title}</span>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.companyName}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", stageColor(deal.stage))}>
                        {stageLabel(deal.stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{deal.ownerName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(deal.value)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{formatDate(deal.expectedCloseDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/deals/${deal.id}`}>
                          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <ExternalLink size={13} />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(deal.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
          </DialogHeader>
          <DealForm
            owners={owners ?? []}
            onSubmit={handleCreate}
            isSubmitting={createDeal.isPending}
            submitLabel="Create Deal"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deal?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
