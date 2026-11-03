import { useQuery } from "@tanstack/react-query";

import { coaches, trainingPrograms } from "@/content/training";
import type { Coach, TrainingProgram } from "@/types/content";

export type TrainingResponse = { coaches: Coach[]; programs: TrainingProgram[] };

export const trainingQueryKey = ["training"] as const;

export async function fetchTraining(): Promise<TrainingResponse> {
  const res = await fetch("/api/training");
  if (!res.ok) throw new Error("Failed to load training info");
  return (await res.json()) as TrainingResponse;
}

/** Server Component prefetch: read content directly, no self-HTTP round-trip. */
export async function getTrainingServer(): Promise<TrainingResponse> {
  return { coaches, programs: trainingPrograms };
}

export function useTraining() {
  return useQuery({ queryKey: trainingQueryKey, queryFn: fetchTraining });
}
