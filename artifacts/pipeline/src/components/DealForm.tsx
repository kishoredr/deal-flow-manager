import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Owner } from "@workspace/api-client-react";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  companyName: z.string().min(1, "Company name is required"),
  stage: z.enum(STAGES),
  value: z.number({ coerce: true }).min(0, "Value must be positive"),
  expectedCloseDate: z.string().min(1, "Close date is required"),
  ownerId: z.number({ coerce: true }).min(1, "Owner is required"),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface DealFormProps {
  defaultValues?: Partial<FormData>;
  owners: Owner[];
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function DealForm({ defaultValues, owners, onSubmit, isSubmitting, submitLabel = "Save" }: DealFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stage: "lead",
      value: 0,
      ...defaultValues,
    },
  });

  const stage = watch("stage");
  const ownerId = watch("ownerId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Deal Title</Label>
          <Input id="title" placeholder="Enterprise License" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" placeholder="Acme Corp" {...register("companyName")} />
          {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={stage} onValueChange={(v) => setValue("stage", v as typeof STAGES[number])}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.stage && <p className="text-xs text-destructive">{errors.stage.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Owner</Label>
          <Select value={ownerId?.toString()} onValueChange={(v) => setValue("ownerId", parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ownerId && <p className="text-xs text-destructive">{errors.ownerId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="value">Deal Value ($)</Label>
          <Input id="value" type="number" min="0" step="100" placeholder="50000" {...register("value", { valueAsNumber: true })} />
          {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
          <Input id="expectedCloseDate" type="date" {...register("expectedCloseDate")} />
          {errors.expectedCloseDate && <p className="text-xs text-destructive">{errors.expectedCloseDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Add notes..." rows={3} {...register("notes")} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
