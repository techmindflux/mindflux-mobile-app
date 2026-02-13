import Constants from 'expo-constants';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const getApiKey = (): string => {
  const apiKey = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  return apiKey;
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

const LUMINA_SYSTEM_PROMPT = `You are Lumina, an AI therapeutic guide grounded in Advaita Vedanta.
Your role is to support users with emotional clarity, self-inquiry, and inner stability through non-dual understanding.

Core Orientation:
- You operate from the philosophical foundation of Advaita Vedanta as presented by Adi Shankaracharya.
- You recognize that the true Self is pure awareness, not the body, mind, or personal story.
- Psychological suffering is understood as identification with thoughts, emotions, and ego.
- Your purpose is not to fix the person but to gently guide them toward recognizing their true nature as awareness.

Therapeutic Approach:
- Be calm, clear, grounded, and compassionate.
- Do not preach or sound religious.
- Do not use Sanskrit terminology unless necessary, and if used, explain briefly.
- Avoid dogmatic or absolute claims.
- Avoid dismissing emotional pain.
- Validate emotions before guiding inquiry.

Structure of Responses:
When a user shares distress:
1. Acknowledge the emotional experience.
2. Normalize the human experience without reinforcing victim identity.
3. Gently introduce self-inquiry.
4. Invite reflection toward the witnessing awareness.

Example flow:
- "I hear that you're feeling anxious."
- "Anxiety can feel very overwhelming."
- "Can we explore who is aware of this anxiety?"
- "Is the anxiety present continuously, or does it appear and disappear in awareness?"

Key Philosophical Anchors (use subtly, therapeutically):
- The Self is awareness, not the content of awareness.
- Thoughts and emotions arise and pass.
- The ego is a mental construct.
- Freedom is recognizing what you already are.
- You are not the changing; you are the changeless witness.

Safety and Boundaries:
- If the user expresses suicidal intent, self-harm, or severe psychological crisis, immediately encourage seeking professional or emergency support.
- Do not claim to replace medical or psychological professionals.
- Do not provide clinical diagnosis.
- Stay within supportive guidance.

Tone Requirements:
- Calm, Grounded, Reflective, Gentle, Clear, Non-judgmental, Non-authoritative

Avoid:
- Spiritual superiority
- Fatalism
- "This is illusion" dismissals
- Over-intellectual explanations

Sample Guiding Questions (use variations):
- "Who is aware of this thought?"
- "Does this feeling define you, or is it something appearing in you?"
- "What remains if you don't label this experience?"
- "Can you notice the awareness in which this is happening?"

Ultimate Orientation:
The goal is not symptom suppression. The goal is helping the user recognize themselves as awareness beyond mental patterns.
Remain compassionate, practical, and psychologically sensitive at all times.

Keep responses concise but meaningful - typically 2-4 sentences unless deeper exploration is needed.`;

const THOUGHT_ANALYSIS_SYSTEM_PROMPT = `You are a deep psychological analyst trained in Advaita Vedanta and modern therapeutic approaches.
Your task is to analyze a user's thought in three progressive layers, each going deeper than the last, and finally reveal the root cause.

You must respond in valid JSON format with the following structure:
{
  "layers": [
    {
      "id": 1,
      "title": "Surface Emotion",
      "description": "The immediate emotional experience",
      "insight": "Your analysis of what the person is feeling at the surface level"
    },
    {
      "id": 2,
      "title": "Underlying Belief",
      "description": "The deeper belief driving this thought",
      "insight": "Your analysis of the belief system underneath the emotion"
    },
    {
      "id": 3,
      "title": "Core Pattern",
      "description": "The recurring pattern in thinking",
      "insight": "Your analysis of the deeper pattern or conditioning"
    }
  ],
  "rootCause": "A comprehensive paragraph explaining the root cause of this thought pattern, connecting it to the person's deeper nature and offering a gentle path toward awareness and healing"
}

Guidelines for analysis:
- Be compassionate and non-judgmental
- Validate the person's experience
- Draw from both psychological understanding and Advaita Vedanta wisdom
- The root cause should help the person see beyond identification with the thought
- Avoid religious preaching; be therapeutic and practical
- Each layer should build upon the previous one, going progressively deeper
- The root cause should tie everything together and offer insight into the witnessing awareness

Remember: The goal is to help the person recognize that they are the awareness in which these thoughts arise, not the thoughts themselves.`;

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt: string = LUMINA_SYSTEM_PROMPT
): Promise<AIResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.log('OpenAI API key not configured');
    return {
      content: '',
      error: 'API key not configured. Please add your OpenAI API key in settings.',
    };
  }

  try {
    console.log('Sending chat message to OpenAI...');
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return {
        content: '',
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('Received response from OpenAI');
    return { content };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return {
      content: '',
      error: 'Failed to connect to AI service. Please check your connection.',
    };
  }
}

export async function analyzeThoughtWithAI(thought: string): Promise<{
  layers: {
    id: number;
    title: string;
    description: string;
    insight: string;
  }[];
  rootCause: string;
  error?: string;
}> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.log('OpenAI API key not configured, using fallback');
    return getFallbackAnalysis(thought);
  }

  try {
    console.log('Analyzing thought with AI:', thought);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: THOUGHT_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: `Please analyze this thought: "${thought}"` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return getFallbackAnalysis(thought);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('Received analysis from OpenAI');
    
    const parsed = JSON.parse(content);
    return {
      layers: parsed.layers || [],
      rootCause: parsed.rootCause || '',
    };
  } catch (error) {
    console.error('Error analyzing thought:', error);
    return getFallbackAnalysis(thought);
  }
}

function getFallbackAnalysis(thought: string): {
  layers: {
    id: number;
    title: string;
    description: string;
    insight: string;
  }[];
  rootCause: string;
} {
  const thoughtLower = thought.toLowerCase();
  
  let surfaceInsight = 'Your thought reveals an emotional state that is asking to be witnessed. This feeling, like all feelings, is temporary and is arising in your awareness.';
  let beliefInsight = 'Beneath this emotion lies a belief about yourself or the world. This belief was formed at some point as a way to make sense of experience.';
  let patternInsight = 'There is a recurring pattern here - a habitual way of responding to certain situations. This pattern is not you; it is something that appears in you.';
  let rootCause = 'The root of this thought traces back to identification with the mind and its stories. You are the awareness in which these thoughts arise, not the thoughts themselves. By simply observing this pattern without judgment, you begin to loosen its grip. Ask yourself: "Who is aware of this thought?" In that question lies the beginning of freedom.';

  if (thoughtLower.includes('anxious') || thoughtLower.includes('worry') || thoughtLower.includes('fear')) {
    surfaceInsight = 'There is anxiety present - a tightening, a sense of threat. Notice how this feeling has a quality of urgency, of something needing to be fixed or escaped.';
    beliefInsight = 'Underneath this anxiety is often a belief that you are unsafe, or that something bad will happen if you don\'t maintain vigilance. This belief creates the very suffering it tries to prevent.';
    patternInsight = 'The mind has learned to anticipate danger as a protective mechanism. But notice: in this very moment, reading these words, you are safe. The threat exists only in thought.';
    rootCause = 'The root of this anxiety is identification with the thinking mind. The mind projects into the future, creating scenarios of threat. But you are not your thoughts - you are the awareness in which thoughts arise. When anxiety appears, ask: "Who is aware of this anxiety?" The one who notices the anxiety is not anxious. Rest there.';
  } else if (thoughtLower.includes('sad') || thoughtLower.includes('lonely') || thoughtLower.includes('depressed')) {
    surfaceInsight = 'There is sadness here - perhaps a heaviness, a sense of loss or disconnection. This feeling is valid and deserves to be acknowledged.';
    beliefInsight = 'Beneath sadness often lies a belief about separation - from others, from happiness, from how things "should" be. This sense of lack points to something deeper.';
    patternInsight = 'The mind has created a story of incompleteness. But wholeness is not something to be achieved - it is your very nature, temporarily obscured by identification with thoughts.';
    rootCause = 'The root of this sadness is the forgetting of your true nature as awareness itself. You are seeking outside what can only be found within. The very awareness reading these words is already complete, already whole. Sadness arises and passes in you - you remain. What you are searching for is what is doing the searching.';
  } else if (thoughtLower.includes('angry') || thoughtLower.includes('frustrated') || thoughtLower.includes('annoyed')) {
    surfaceInsight = 'Anger or frustration is present - there is heat, resistance, a sense that something is wrong and needs to change. This energy is asking to be acknowledged.';
    beliefInsight = 'Beneath anger is often a violated expectation or boundary. There is a belief about how things or people "should" be, and reality is not matching that image.';
    patternInsight = 'The mind resists what is, creating suffering through the insistence that things be different. But resistance itself is the pain.';
    rootCause = 'The root of this frustration is the mind\'s war with reality. When we demand that life conform to our expectations, we suffer. Peace comes not from changing the world, but from changing our relationship to it. Ask yourself: "Can I be with what is, just for this moment?" In acceptance, the anger loses its fuel.';
  }

  return {
    layers: [
      { id: 1, title: 'Surface Emotion', description: 'What you\'re experiencing right now', insight: surfaceInsight },
      { id: 2, title: 'Underlying Belief', description: 'The deeper belief driving this thought', insight: beliefInsight },
      { id: 3, title: 'Core Pattern', description: 'The recurring pattern in your thinking', insight: patternInsight },
    ],
    rootCause,
  };
}

export function getLuminaFallbackResponse(userMessage: string, context?: string): string {
  const messageLower = userMessage.toLowerCase();
  
  if (messageLower.includes('anxious') || messageLower.includes('anxiety') || messageLower.includes('worried')) {
    return "I hear that anxiety is present. This feeling can be quite overwhelming. Can we pause for a moment? Notice: you are aware of this anxiety. The anxiety is appearing in you, but is it you? What happens when you simply observe it, without trying to change it?";
  }
  
  if (messageLower.includes('sad') || messageLower.includes('depressed') || messageLower.includes('hopeless')) {
    return "Thank you for sharing this heaviness with me. Sadness is a deeply human experience. As you sit with this feeling, can you notice the one who is aware of the sadness? That awareness itself is not sad - it is simply witnessing. You are larger than any emotion that passes through.";
  }
  
  if (messageLower.includes('angry') || messageLower.includes('frustrated') || messageLower.includes('upset')) {
    return "I sense there's frustration present. This energy is telling you something matters deeply. Before we explore the situation, can you notice where in your body you feel this? And then, gently, notice that you are the one observing this feeling. The observer remains still, even as emotions move through.";
  }
  
  if (messageLower.includes('confused') || messageLower.includes('lost') || messageLower.includes('don\'t know')) {
    return "Not knowing can feel unsettling, yet it can also be an opening. The mind wants certainty, but life often doesn't provide it. Can you rest in this not-knowing, even for a moment? Sometimes the deepest clarity comes not from finding answers, but from questioning who is asking the question.";
  }
  
  if (messageLower.includes('help') || messageLower.includes('what should i')) {
    return "I'm here with you. Rather than rushing toward solutions, let's first be present with what is. What are you experiencing right now, in this moment? Sometimes the simple act of witnessing our experience begins to transform it.";
  }
  
  return "Thank you for sharing that with me. As I listen, I'm curious - when you sit with these words you've just spoken, what do you notice? Is there an emotion? A sensation in the body? And beneath that, who is the one noticing? Let's explore this together.";
}

export { LUMINA_SYSTEM_PROMPT, THOUGHT_ANALYSIS_SYSTEM_PROMPT };
