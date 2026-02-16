import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CheckInData } from '../types/checkin';

export interface CheckInRecord extends CheckInData {
  id: string;
}

const STORAGE_KEY = 'mindflux_checkins';

export const [CheckInProvider, useCheckIns] = createContextHook(() => {
  const queryClient = useQueryClient();

  const checkInsQuery = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => {
      console.log('Loading check-ins from storage');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const checkins = stored ? JSON.parse(stored) : [];
      console.log('Loaded check-ins:', checkins.length);
      return checkins as CheckInRecord[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (checkins: CheckInRecord[]) => {
      console.log('Saving check-ins to storage:', checkins.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
      return checkins;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = checkInsQuery.data || [];
      const updated = current.filter((c) => c.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
  });

  const addCheckIn = useCallback(
    (data: CheckInData) => {
      const record: CheckInRecord = {
        ...data,
        id: Date.now().toString(),
      };
      const current = checkInsQuery.data || [];
      saveMutation.mutate([record, ...current]);
      console.log('Check-in saved:', record.id);
    },
    [checkInsQuery.data, saveMutation.mutate],
  );

  const deleteCheckIn = useCallback(
    (id: string) => {
      console.log('Deleting check-in:', id);
      deleteMutation.mutate(id);
    },
    [deleteMutation.mutate],
  );

  return {
    checkIns: checkInsQuery.data || [],
    isLoading: checkInsQuery.isLoading,
    addCheckIn,
    deleteCheckIn,
  };
});
