"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useExerciseHistory } from "@/hooks/use-exercise-history";
import { ExerciseHistoryChart } from "@/components/workout/exercise-history-chart";
import { Trophy } from "lucide-react";
import { fetchExerciseData } from "@/utils/api";
import { getDoc, doc } from "firebase/firestore";
import { db as dbRaw } from "@/lib/firebase/firebase";
import type { Firestore } from "firebase/firestore";
const db: Firestore = dbRaw as Firestore;

interface ExerciseData {
  id: string;
  name?: string;
}

// Child component: only rendered when exerciseName is available
function ClientExerciseHistoryContent({ clientId, exerciseName, exerciseId }: { clientId: string; exerciseName: string; exerciseId: string }) {
  const { sessions, prs, loading, error } = useExerciseHistory(clientId, exerciseName, exerciseId);
  const chartData = useMemo(
    () =>
      sessions
        .filter((s) => s.oneRepMax)
        .map((s) => ({
          date:
            typeof s.createdAt === "object" && s.createdAt.seconds
              ? new Date(s.createdAt.seconds * 1000).toISOString().slice(0, 10)
              : String(s.createdAt).slice(0, 10),
          oneRepMax: s.oneRepMax,
        })),
    [sessions],
  );
  const prSetIds = useMemo(() => new Set(prs.map((pr) => pr.setId)), [prs]);

  // Only show sessions with at least one set that has both weight and reps
  const filteredSessions = sessions.filter(session =>
    Array.isArray(session.sets) && session.sets.some(set => set.weight && set.reps)
  );

  // Helper to format date as dd.mm.yyyy
  function formatDateDMY(date: any) {
    const d = typeof date === "object" && date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-8 font-['Sen']">
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{exerciseName}</h1>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center">Loading...</div>
        ) : error ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-red-500">{error}</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-8">
              <ExerciseHistoryChart
                entries={chartData.map((d) => ({
                  id: d.date,
                  date: d.date,
                  formattedDate: d.date,
                  weight: `${d.oneRepMax} kg`,
                  reps: 1,
                  sets: 1,
                  totalVolume: d.oneRepMax ?? 0,
                }))}
                title="1RM Progress"
                timeRange="6m"
              />
            </div>
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-4 text-gray-500">No sessions found for this exercise.</div>
              ) : (
                filteredSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-lg shadow p-4">
                    <div className="font-medium mb-2">
                      {formatDateDMY(session.createdAt)}
                    </div>
                    <div className="space-y-1">
                      {session.sets.map((set, idx) => {
                        const isPR = prSetIds.has(set.id);
                        // Only show sets with both weight and reps
                        if (!set.weight || !set.reps) return null;
                        return (
                          <div key={set.id || idx} className="flex items-center gap-2">
                            <span className="inline-block w-16 font-mono text-left">Set {idx + 1}:</span>
                            {isPR ? (
                              <span className="flex items-center bg-yellow-50 rounded px-2 py-1">
                                <span>
                                  {set.weight} kg × {set.reps} reps
                                  {set.notes && (
                                    <span className="ml-2 italic text-gray-500">({set.notes})</span>
                                  )}
                                </span>
                                <Trophy className="w-4 h-4 text-amber-500 ml-2" />
                              </span>
                            ) : (
                              <span>
                                {set.weight} kg × {set.reps} reps
                                {set.notes && (
                                  <span className="ml-2 italic text-gray-500">({set.notes})</span>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientExerciseHistoryPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const exerciseId = params.exerciseId as string;

  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setNameLoading(true);
    setNameError(null);
    // Try global exercises collection first
    fetchExerciseData(exerciseId)
      .then(async (data: ExerciseData | null) => {
        if (data && data.name) {
          setExerciseName(data.name);
        } else {
          // Try user-specific custom exercises
          try {
            const userExerciseDoc = await getDoc(doc(db, `users/${clientId}/exercises`, exerciseId));
            if (userExerciseDoc.exists() && userExerciseDoc.data().name) {
              setExerciseName(userExerciseDoc.data().name);
            } else {
              setNameError("Exercise not found");
            }
          } catch (err) {
            setNameError("Failed to fetch exercise name");
          }
        }
      })
      .catch((err) => {
        setNameError("Failed to fetch exercise name");
      })
      .finally(() => setNameLoading(false));
  }, [exerciseId, clientId]);

  if (!hasMounted) {
    return null;
  }
  if (nameLoading) {
    return <div className="p-8">Loading exercise info...</div>;
  }
  if (nameError || !exerciseName) {
    return <div className="p-8 text-red-500">{nameError || "Exercise name not found"}</div>;
  }

  // Only render the content component when exerciseName is available
  return <ClientExerciseHistoryContent clientId={clientId} exerciseName={exerciseName} exerciseId={exerciseId} />;
} 