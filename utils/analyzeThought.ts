import { ThoughtLayer } from '../types/thought';
import { analyzeThoughtWithAI } from './aiService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeThought(
  thought: string,
  onLayerComplete: (layer: ThoughtLayer) => void,
  onRootCause: (rootCause: string) => void,
  onSentiment?: (sentiment: number) => void
): Promise<void> {
  console.log('Starting AI-powered thought analysis for:', thought);
  
  try {
    const analysisPromise = analyzeThoughtWithAI(thought);
    
    await delay(1500);
    
    const result = await analysisPromise;
    
    if (result.error) {
      console.log('AI analysis error, using fallback:', result.error);
    }
    
    for (let i = 0; i < result.layers.length; i++) {
      const layer = result.layers[i];
      console.log('Layer complete:', layer.id, '-', layer.title);
      onLayerComplete(layer);
      
      if (i < result.layers.length - 1) {
        await delay(1800);
      }
    }
    
    await delay(2000);
    console.log('Root cause generated');
    onRootCause(result.rootCause);
    
    if (onSentiment) {
      console.log('Sentiment score from analysis:', result.sentiment);
      onSentiment(result.sentiment);
    }
    
  } catch (error) {
    console.error('Error in thought analysis:', error);
    
    const fallbackLayers: ThoughtLayer[] = [
      {
        id: 1,
        title: 'Surface Emotion',
        description: 'What you\'re feeling right now',
        insight: 'Your thought reveals an emotional state that deserves acknowledgment. This feeling, like all feelings, is arising in awareness and will pass.',
      },
      {
        id: 2,
        title: 'Underlying Belief',
        description: 'The deeper belief driving this thought',
        insight: 'Beneath this emotion lies a belief about yourself or the world. This belief was formed as a way to make sense of experience.',
      },
      {
        id: 3,
        title: 'Core Pattern',
        description: 'The recurring pattern in your thinking',
        insight: 'There is a recurring pattern here - a habitual way of responding. This pattern is not you; it is something that appears in you.',
      },
    ];

    for (const layer of fallbackLayers) {
      await delay(1800);
      onLayerComplete(layer);
    }

    await delay(2000);
    onRootCause(
      'The root of this thought traces back to identification with the mind and its stories. You are the awareness in which these thoughts arise, not the thoughts themselves. By simply observing this pattern without judgment, you begin to loosen its grip. Ask yourself: "Who is aware of this thought?" In that question lies the beginning of freedom.'
    );
    
    if (onSentiment) {
      onSentiment(40);
    }
  }
}
