import { useState } from "react";
import {
  useListOwners,
  useCreateOwner,
  useUpdateOwner,
  useDeleteOwner,
  getListOwnersQueryKey,
} from "@workspace/api-client-react";
import type { Owner } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function OwnerFormFields({ register, errors }: { register: any; errors: any }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Sarah Chen" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="sarah@company.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
        <Input id="avatarUrl" placeholder="https://..." {...register("avatarUrl")} />
        {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
      </div>
    </div>
  );
}

export default function Owners() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<Owner | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: owners, isLoading } = useListOwners();
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  const deleteOwner = useDeleteOwner();

  const createForm = useForm<FormData>({ resolver: zodResolver(schema) });
  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editOwner ? { name: editOwner.name, email: editOwner.email, avatarUrl: editOwner.avatarUrl ?? "" } : {},
  });

  function handleCreate(data: FormData) {
    createOwner.mutate(
      { data: { name: data.name, email: data.email, avatarUrl: data.avatarUrl || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOwnersQueryKey() });
          setCreateOpen(false);
          createForm.reset();
          toast({ title: "Owner created" });
        },
        onError: () => toast({ title: "Failed to create owner", variant: "destructive" }),
      }
    );
  }

  function handleEdit(data: FormData) {
    if (!editOwner) return;
    updateOwner.mutate(
      { id: editOwner.id, data: { name: data.name, email: data.email, avatarUrl: data.avatarUrl || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOwnersQueryKey() });
          setEditOwner(null);
          toast({ title: "Owner updated" });
        },
        onError: () => toast({ title: "Failed to update owner", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteOwner.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOwnersQueryKey() });
          setDeleteId(null);
          toast({ title: "Owner deleted" });
        },
        onError: () => toast({ title: "Failed to delete owner", variant: "destructive" }),
      }
    );
  }

  function openEdit(owner: Owner) {
    editForm.reset({ name: owner.name, email: owner.email, avatarUrl: owner.avatarUrl ?? "" });
    setEditOwner(owner);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Owners</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage deal owners and their accounts</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus size={15} /> Add Owner
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : !owners?.length ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No owners yet — add your first team member
          </div>
        ) : (
          <div className="divide-y divide-border">
            {owners.map((owner) => (
              <div key={owner.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {owner.avatarUrl ? (
                    <img src={owner.avatarUrl} alt={owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{owner.name}</p>
                  <p className="text-xs text-muted-foreground">{owner.email}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(owner)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(owner.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 mt-2">
            <OwnerFormFields register={createForm.register} errors={createForm.formState.errors} />
            <Button type="submit" disabled={createOwner.isPending} className="w-full">
              {createOwner.isPending ? "Creating..." : "Create Owner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editOwner} onOpenChange={(open) => !open && setEditOwner(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4 mt-2">
            <OwnerFormFields register={editForm.register} errors={editForm.formState.errors} />
            <Button type="submit" disabled={updateOwner.isPending} className="w-full">
              {updateOwner.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this owner?</AlertDialogTitle>
            <AlertDialogDescription>This may affect deals assigned to this owner.</AlertDialogDescription>
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
