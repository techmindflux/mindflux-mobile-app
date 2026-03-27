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
  const [sentiment, setSentiment] = useState<number>(50);
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
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      originalThought: thought,
      layers: [],
      rootCause: '',
      sentiment: 50,
      createdAt: new Date().toISOString(),
      isAnalyzing: true,
    };
    setCurrentAnalysis(newAnalysis);
    setAnalysisLayers([]);
    setRootCause(null);
    setSentiment(50);
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

  const setAnalysisSentiment = useCallback((score: number) => {
    console.log('Setting sentiment score:', score);
    setSentiment(score);
  }, []);

  const completeAnalysis = useCallback(() => {
    if (!currentAnalysis || !rootCause) return;
    
    const completedAnalysis: ThoughtAnalysis = {
      ...currentAnalysis,
      layers: analysisLayers,
      rootCause: rootCause,
      sentiment: sentiment,
      isAnalyzing: false,
    };
    
    const current = thoughtsQuery.data || [];
    const alreadyExists = current.some(t => t.id === completedAnalysis.id);
    if (alreadyExists) {
      console.log('Analysis already saved, skipping duplicate');
      return;
    }
    saveMutation.mutate([completedAnalysis, ...current]);
    setCurrentAnalysis(null);
    
    console.log('Analysis completed and saved');
  }, [currentAnalysis, analysisLayers, rootCause, sentiment, thoughtsQuery.data, saveMutation.mutate]);

  const deleteThought = useCallback((id: string) => {
    console.log('Deleting thought:', id);
    deleteMutation.mutate(id);
  }, [deleteMutation.mutate]);

  const clearCurrentAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setAnalysisLayers([]);
    setRootCause(null);
    setSentiment(50);
    setIsAnalyzing(false);
  }, []);

  return {
    thoughts: thoughtsQuery.data || [],
    isLoading: thoughtsQuery.isLoading,
    currentAnalysis,
    analysisLayers,
    rootCause,
    sentiment,
    isAnalyzing,
    startAnalysis,
    addLayer,
    setAnalysisRootCause,
    setAnalysisSentiment,
    completeAnalysis,
    deleteThought,
    clearCurrentAnalysis,
  };
});
