import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetDeal,
  useUpdateDeal,
  useDeleteDeal,
  useListOwners,
  getGetDealQueryKey,
  getListDealsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, stageLabel, stageColor, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DealForm from "@/components/DealForm";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const dealId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useGetDeal(dealId, { query: { enabled: !!dealId, queryKey: getGetDealQueryKey(dealId) } });
  const { data: owners } = useListOwners();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  function handleUpdate(data: any) {
    updateDeal.mutate(
      { id: dealId, data: { ...data, notes: data.notes ?? null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(dealId) });
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          setEditing(false);
          toast({ title: "Deal updated" });
        },
        onError: () => toast({ title: "Failed to update deal", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    deleteDeal.mutate(
      { id: dealId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          toast({ title: "Deal deleted" });
          navigate("/deals");
        },
        onError: () => toast({ title: "Failed to delete deal", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl space-y-4">
          <div className="h-8 bg-muted/50 rounded animate-pulse w-48" />
          <div className="h-40 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl text-center py-16">
          <p className="text-muted-foreground">Deal not found</p>
          <Link href="/deals">
            <Button variant="outline" className="mt-4">Back to Deals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const days = daysUntil(deal.expectedCloseDate);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/deals">
            <button className="mt-1 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{deal.title}</h1>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", stageColor(deal.stage))}>
                {stageLabel(deal.stage)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{deal.companyName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)} className="gap-1.5">
              <Edit2 size={13} /> {editing ? "Cancel" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50">
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>

        {editing ? (
          <div className="bg-card border border-border rounded-lg p-5">
            <DealForm
              defaultValues={{
                title: deal.title,
                companyName: deal.companyName,
                stage: deal.stage as any,
                value: parseFloat(String(deal.value)),
                expectedCloseDate: deal.expectedCloseDate,
                ownerId: deal.ownerId,
                notes: deal.notes,
              }}
              owners={owners ?? []}
              onSubmit={handleUpdate}
              isSubmitting={updateDeal.isPending}
              submitLabel="Save Changes"
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            <div className="grid grid-cols-2 gap-0">
              <div className="p-5 border-r border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Deal Value</p>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(deal.value)}</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Close Date</p>
                <p className="text-sm font-medium">{formatDate(deal.expectedCloseDate)}</p>
                <p className={cn("text-xs mt-0.5", days < 0 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-muted-foreground")}>
                  {days === 0 ? "Due today" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Deal Owner</p>
              <p className="text-sm font-medium">{deal.ownerName ?? "Unassigned"}</p>
            </div>
            {deal.notes && (
              <div className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Notes</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
            <div className="px-5 py-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Created {formatDate(deal.createdAt)} · Updated {formatDate(deal.updatedAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deal.title}"?</AlertDialogTitle>
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
