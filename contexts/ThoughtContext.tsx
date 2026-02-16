import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { ThoughtAnalysis, ThoughtLayer } from '../types/thought';

const STORAGE_KEY = 'mindflux_thoughts';

export const [ThoughtProvider, useThoughts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentAnalysis, setCurrentAnalysis] = useState<ThoughtAnalysis | null>(null);
  const [analysisLayers, setAnalysisLayers] = useState<ThoughtLayer[]>([]);
  const [rootCause, setRootCause] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const thoughtsQuery = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      console.log('Loading thoughts from storage');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const thoughts = stored ? JSON.parse(stored) : [];
      console.log('Loaded thoughts:', thoughts.length);
      return thoughts as ThoughtAnalysis[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (thoughts: ThoughtAnalysis[]) => {
      console.log('Saving thoughts to storage:', thoughts.length);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
      return thoughts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const current = thoughtsQuery.data || [];
      const updated = current.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    },
  });

  const startAnalysis = useCallback((thought: string) => {
    console.log('Starting analysis for:', thought);
    const newAnalysis: ThoughtAnalysis = {
      id: Date.now().toString(),
      originalThought: thought,
      layers: [],
      rootCause: '',
      createdAt: new Date().toISOString(),
      isAnalyzing: true,
    };
    setCurrentAnalysis(newAnalysis);
    setAnalysisLayers([]);
    setRootCause(null);
    setIsAnalyzing(true);
  }, []);

  const addLayer = useCallback((layer: ThoughtLayer) => {
    console.log('Adding layer:', layer.id);
    setAnalysisLayers(prev => [...prev, layer]);
  }, []);

  const setAnalysisRootCause = useCallback((cause: string) => {
    console.log('Setting root cause');
    setRootCause(cause);
    setIsAnalyzing(false);
  }, []);

  const completeAnalysis = useCallback(() => {
    if (!currentAnalysis || !rootCause) return;
    
    const completedAnalysis: ThoughtAnalysis = {
      ...currentAnalysis,
      layers: analysisLayers,
      rootCause: rootCause,
      isAnalyzing: false,
    };
    
    const current = thoughtsQuery.data || [];
    saveMutation.mutate([completedAnalysis, ...current]);
    
    console.log('Analysis completed and saved');
  }, [currentAnalysis, analysisLayers, rootCause, thoughtsQuery.data, saveMutation.mutate]);

  const deleteThought = useCallback((id: string) => {
    console.log('Deleting thought:', id);
    deleteMutation.mutate(id);
  }, [deleteMutation.mutate]);

  const clearCurrentAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setAnalysisLayers([]);
    setRootCause(null);
    setIsAnalyzing(false);
  }, []);

  return {
    thoughts: thoughtsQuery.data || [],
    isLoading: thoughtsQuery.isLoading,
    currentAnalysis,
    analysisLayers,
    rootCause,
    isAnalyzing,
    startAnalysis,
    addLayer,
    setAnalysisRootCause,
    completeAnalysis,
    deleteThought,
    clearCurrentAnalysis,
  };
});
