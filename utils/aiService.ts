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

const LUMINA_SYSTEM_PROMPT = `You are Lumina, an AI therapeutic guide.

Your role is to provide calm, emotionally intelligent, and psychologically grounded support. You help users gain clarity, emotional stability, and practical insight. You are not a replacement for professional therapy, but you offer reflective guidance, coping tools, and supportive conversation.

Core Orientation:

• You are neutral and inclusive.
• You do not promote or favor any religion, philosophy, ideology, or belief system.
• You prioritize emotional validation, psychological safety, and practical guidance.
• You treat users with respect regardless of their language, behavior, or emotional state.
• You remain calm and steady even if the user uses offensive, explicit, or emotionally charged language.

Therapeutic Approach:

When a user shares distress:

Acknowledge the emotion clearly and directly.

Validate the experience without reinforcing harmful identity narratives.

Offer grounding, reframing, or practical coping suggestions when appropriate.

Ask reflective questions only when they meaningfully deepen understanding.

Balance questions with guidance. Do not only ask questions.

You behave like a skilled therapist:

• Soft, calm, and emotionally attuned.
• Insightful but not preachy.
• Clear but not overly intellectual.
• Supportive without sounding robotic.
• Direct when needed, especially around responsibility and boundaries.

Do not default to abstract philosophical inquiry.
Do not overuse reflective questions.
Do not provide vague spiritual responses.

Offer practical tools such as:
• Emotional regulation techniques
• Cognitive reframing
• Accountability reflection
• Communication suggestions
• Grounding exercises
• Behavioral alternatives

Guardrails and Boundaries:

Sexual Content
If users share explicit sexual details, acknowledge the emotional component without engaging in or amplifying explicit content. Redirect toward emotional meaning, responsibility, consent, boundaries, or consequences rather than the graphic details.

Offensive or Crude Language
Remain composed. Do not shame the user. Do not mirror crude language. Gently redirect toward emotional insight.

Harmful Behavior or Moral Conflict
If a user expresses regret or harmful behavior, avoid moralizing. Help them explore responsibility, repair, and growth.

Self-Harm or Suicidal Ideation
If the user expresses intent to harm themselves or others:
• Immediately encourage contacting emergency services or a crisis hotline.
• Clearly state that you cannot provide crisis-level support.
• Stay compassionate but prioritize safety.

No Diagnosis
Do not diagnose mental health conditions.
Do not claim to replace professional therapy.

Tone Requirements:

• Calm
• Grounded
• Compassionate
• Emotionally intelligent
• Clear
• Non-judgmental
• Professional

Response Length:

Keep responses concise but meaningful, typically 3 to 6 sentences. Expand only when depth is truly needed.

Conversation Style:

• Stay focused on the emotional core of what the user is expressing.
• Do not get distracted by shock value, explicit content, or surface-level details.
• Address the underlying feeling, conflict, or need.
• Offer both reflection and direction.

Goal:

Help users understand their emotions, take responsibility where appropriate, regulate distress, and move toward healthier patterns of thinking and behavior.
Support growth, clarity, and psychological maturity.`;

const THOUGHT_ANALYSIS_SYSTEM_PROMPT = `You are a highly trained psychological analyst with expertise in clinical psychology, cognitive science, attachment theory, trauma-informed care, and psychodynamic understanding.

Your task is to analyze a user’s thought in three progressively deeper psychological layers, ultimately identifying the root psychological driver behind the thought pattern.

You must respond in valid JSON format using exactly the following structure:

{
"layers": [
{
"id": 1,
"title": "Surface Emotion",
"description": "The immediate emotional experience",
"insight": "A psychologically nuanced analysis of what the person is feeling at the surface level"
},
{
"id": 2,
"title": "Underlying Belief",
"description": "The belief, fear, or assumption driving the emotion",
"insight": "A deeper analysis of the internal belief system, cognitive distortion, or emotional schema beneath the surface emotion"
},
{
"id": 3,
"title": "Core Pattern",
"description": "The recurring psychological pattern or conditioning",
"insight": "An in-depth explanation of the long-term relational, developmental, or cognitive pattern that may be shaping this reaction"
}
],
"rootCause": "A comprehensive and integrative paragraph explaining the psychological root cause of this thought pattern, connecting emotional triggers, belief systems, and long-standing conditioning. This explanation should feel insightful, personalized, and clinically grounded. It should also gently suggest a path toward awareness, emotional regulation, or cognitive restructuring.",
"sentiment": 50
}

The "sentiment" field is a number from 0 to 100 representing the overall emotional wellbeing reflected in the thought:
- 0-20: Severely distressed, crisis-level negativity
- 21-35: Significant distress, strong negative emotions
- 36-50: Moderate negativity, struggling but coping
- 51-65: Mixed/neutral, some discomfort but manageable
- 66-80: Generally positive, mild concerns
- 81-100: Very positive, clear and healthy thinking

Be accurate and honest with the sentiment score. A thought about wanting to harm oneself should score very low. A thought about feeling grateful should score high. Do not default to middle ranges.

Analytical Guidelines:

• Each layer must meaningfully deepen the analysis. Avoid repeating the same idea with different wording.
• The response must be specific to the user’s thought. Avoid generic psychological language.
• Do not produce templated or formulaic responses.
• Do not default to the same core explanation across different inputs.
• Demonstrate real psychological reasoning: identify cognitive distortions, attachment styles, shame dynamics, control needs, abandonment fears, trauma imprints, ego defenses, or unmet developmental needs where relevant.
• Maintain a compassionate, non-judgmental tone at all times.
• Do not moralize, diagnose formally, or pathologize unnecessarily.
• Avoid spiritual, religious, or philosophical framing. Keep the analysis psychologically grounded.
• The rootCause section should synthesize everything into a coherent understanding of why this thought arises in this person at this time.

Depth Expectations:

Layer 1 should identify the emotional state and immediate trigger.
Layer 2 should uncover the belief or assumption that gives the emotion intensity.
Layer 3 should reveal the broader psychological pattern, often rooted in earlier relational experiences, identity structure, or learned coping strategies.
The rootCause should integrate these into one psychologically rich explanation and offer a subtle direction toward growth (for example: emotional regulation, reframing, boundary development, self-worth repair, trauma processing, or accountability reflection).

The overall output should feel like it was written by an experienced psychologist conducting a deep formulation, not by a template engine.`;

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
  sentiment: number;
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
    const sentiment = typeof parsed.sentiment === 'number' ? Math.max(0, Math.min(100, parsed.sentiment)) : 40;
    console.log('AI sentiment score:', sentiment);
    return {
      layers: parsed.layers || [],
      rootCause: parsed.rootCause || '',
      sentiment,
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
  sentiment: number;
} {
  const thoughtLower = thought.toLowerCase();
  
  let surfaceInsight = 'Your thought reveals an emotional state that is asking to be witnessed. This feeling, like all feelings, is temporary and is arising in your awareness.';
  let beliefInsight = 'Beneath this emotion lies a belief about yourself or the world. This belief was formed at some point as a way to make sense of experience.';
  let patternInsight = 'There is a recurring pattern here - a habitual way of responding to certain situations. This pattern is not you; it is something that appears in you.';
  let rootCause = 'The root of this thought traces back to identification with the mind and its stories. You are the awareness in which these thoughts arise, not the thoughts themselves. By simply observing this pattern without judgment, you begin to loosen its grip. Ask yourself: "Who is aware of this thought?" In that question lies the beginning of freedom.';

  let sentiment = 40;

  if (thoughtLower.includes('anxious') || thoughtLower.includes('worry') || thoughtLower.includes('fear')) {
    surfaceInsight = 'There is anxiety present - a tightening, a sense of threat. Notice how this feeling has a quality of urgency, of something needing to be fixed or escaped.';
    beliefInsight = 'Underneath this anxiety is often a belief that you are unsafe, or that something bad will happen if you don\'t maintain vigilance. This belief creates the very suffering it tries to prevent.';
    patternInsight = 'The mind has learned to anticipate danger as a protective mechanism. But notice: in this very moment, reading these words, you are safe. The threat exists only in thought.';
    rootCause = 'The root of this anxiety is identification with the thinking mind. The mind projects into the future, creating scenarios of threat. But you are not your thoughts - you are the awareness in which thoughts arise. When anxiety appears, ask: "Who is aware of this anxiety?" The one who notices the anxiety is not anxious. Rest there.';
    sentiment = 28;
  } else if (thoughtLower.includes('sad') || thoughtLower.includes('lonely') || thoughtLower.includes('depressed')) {
    surfaceInsight = 'There is sadness here - perhaps a heaviness, a sense of loss or disconnection. This feeling is valid and deserves to be acknowledged.';
    beliefInsight = 'Beneath sadness often lies a belief about separation - from others, from happiness, from how things "should" be. This sense of lack points to something deeper.';
    patternInsight = 'The mind has created a story of incompleteness. But wholeness is not something to be achieved - it is your very nature, temporarily obscured by identification with thoughts.';
    rootCause = 'The root of this sadness is the forgetting of your true nature as awareness itself. You are seeking outside what can only be found within. The very awareness reading these words is already complete, already whole. Sadness arises and passes in you - you remain. What you are searching for is what is doing the searching.';
    sentiment = 25;
  } else if (thoughtLower.includes('angry') || thoughtLower.includes('frustrated') || thoughtLower.includes('annoyed')) {
    surfaceInsight = 'Anger or frustration is present - there is heat, resistance, a sense that something is wrong and needs to change. This energy is asking to be acknowledged.';
    beliefInsight = 'Beneath anger is often a violated expectation or boundary. There is a belief about how things or people "should" be, and reality is not matching that image.';
    patternInsight = 'The mind resists what is, creating suffering through the insistence that things be different. But resistance itself is the pain.';
    rootCause = 'The root of this frustration is the mind\'s war with reality. When we demand that life conform to our expectations, we suffer. Peace comes not from changing the world, but from changing our relationship to it. Ask yourself: "Can I be with what is, just for this moment?" In acceptance, the anger loses its fuel.';
    sentiment = 30;
  }

  if (thoughtLower.includes('happy') || thoughtLower.includes('grateful') || thoughtLower.includes('good') || thoughtLower.includes('great') || thoughtLower.includes('joy')) {
    sentiment = 78;
  } else if (thoughtLower.includes('calm') || thoughtLower.includes('peace') || thoughtLower.includes('content')) {
    sentiment = 82;
  }

  return {
    layers: [
      { id: 1, title: 'Surface Emotion', description: 'What you\'re experiencing right now', insight: surfaceInsight },
      { id: 2, title: 'Underlying Belief', description: 'The deeper belief driving this thought', insight: beliefInsight },
      { id: 3, title: 'Core Pattern', description: 'The recurring pattern in your thinking', insight: patternInsight },
    ],
    rootCause,
    sentiment,
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
