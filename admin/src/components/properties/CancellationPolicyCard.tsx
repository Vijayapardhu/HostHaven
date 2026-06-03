import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check } from "lucide-react";
import { propertiesService } from "../../lib/properties";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

const POLICIES = [
    { value: "FREE_CANCELLATION", label: "Free Cancellation", desc: "Full refund if cancelled 24h before check-in", color: "emerald" },
    { value: "MODERATE", label: "Moderate", desc: "Full refund 48h before, 50% within 24h", color: "amber" },
    { value: "STRICT", label: "Strict", desc: "Full refund 72h before, no refund within 48h", color: "orange" },
    { value: "NON_REFUNDABLE", label: "Non-refundable", desc: "No refund at any time", color: "rose" },
] as const;

type PolicyValue = typeof POLICIES[number]["value"];

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
};

function detectPolicyFromHours(freeBeforeHours?: number): string {
    if (freeBeforeHours === undefined || freeBeforeHours === null) return "FREE_CANCELLATION";
    if (freeBeforeHours === 0) return "NON_REFUNDABLE";
    if (freeBeforeHours >= 72) return "STRICT";
    if (freeBeforeHours >= 48) return "MODERATE";
    return "FREE_CANCELLATION";
}

interface CancellationPolicyCardProps {
    propertyId: string;
    cancellationPolicy?: {
        id: string;
        freeBeforeHours: number;
        refundPercentBefore: number;
        refundPercentAfter: number;
    } | null;
    onUpdate: () => void;
}

export function CancellationPolicyCard({ propertyId, cancellationPolicy, onUpdate }: CancellationPolicyCardProps) {
    const currentPolicy = detectPolicyFromHours(cancellationPolicy?.freeBeforeHours);
    const [selected, setSelected] = useState<PolicyValue>(currentPolicy as PolicyValue);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (selected === currentPolicy) return;
        setIsSaving(true);
        try {
            await propertiesService.setCancellationPolicy(propertyId, selected);
            toast.success("Cancellation policy updated successfully.");
            onUpdate();
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError?.response?.data?.message || apiError?.message || "Failed to update cancellation policy.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                        Cancellation Policy
                    </CardTitle>
                    {selected !== currentPolicy && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Check className="h-3 w-3" />
                            {isSaving ? "Saving…" : "Save Policy"}
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {POLICIES.map((policy) => {
                        const isActive = selected === policy.value;
                        const isCurrent = currentPolicy === policy.value;
                        return (
                            <button
                                key={policy.value}
                                type="button"
                                onClick={() => setSelected(policy.value)}
                                className={`w-full rounded-xl border p-3.5 text-left transition-all ${isActive
                                        ? `border-${policy.color}-300 bg-${policy.color}-50/60 ring-1 ring-${policy.color}-200`
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {policy.label}
                                        </span>
                                        {isCurrent && (
                                            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                Current
                                            </span>
                                        )}
                                        <p className="mt-0.5 text-xs text-slate-500">{policy.desc}</p>
                                    </div>
                                    <div
                                        className={`h-4 w-4 rounded-full border-2 transition ${isActive ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                                            }`}
                                    >
                                        {isActive && (
                                            <Check className="h-3 w-3 text-white" style={{ margin: "-1px 0 0 -1px" }} />
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {cancellationPolicy && (
                    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Current Policy Details</p>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                            <div>
                                <span className="text-slate-400">Free before</span>
                                <p className="font-semibold">{cancellationPolicy.freeBeforeHours}h</p>
                            </div>
                            <div>
                                <span className="text-slate-400">Refund (before)</span>
                                <p className="font-semibold">{cancellationPolicy.refundPercentBefore}%</p>
                            </div>
                            <div>
                                <span className="text-slate-400">Refund (after)</span>
                                <p className="font-semibold">{cancellationPolicy.refundPercentAfter}%</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
