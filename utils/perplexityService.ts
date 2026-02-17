const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const getPerplexityKey = (): string => {
  return process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY || '';
};

export interface PerplexitySource {
  title: string;
  url: string;
  snippet: string;
}

export interface PerplexityResponse {
  content: string;
  sources: PerplexitySource[];
  error?: string;
}

export async function searchWebContent(
  query: string,
  philosopherName: string,
  philosopherContext: string
): Promise<PerplexityResponse> {
  const apiKey = getPerplexityKey();

  if (!apiKey) {
    console.log('Perplexity API key not configured');
    return {
      content: '',
      sources: [],
      error: 'Perplexity API key not configured',
    };
  }

  const systemPrompt = `You are a research assistant for ${philosopherName}. 
Your job is to find relevant wisdom, teachings, books, articles, and content related to the philosophical discussion.
Search for content from or about ${philosopherName}, as well as related philosophical and psychological resources.
${philosopherContext}

Provide a brief summary of the most relevant findings and how they relate to the user's situation.
Keep your response concise (2-4 sentences) and focused on actionable wisdom.`;

  try {
    console.log('Searching web content via Perplexity for:', query);

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: 600,
        temperature: 0.5,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API error:', response.status, errorData);
      return {
        content: '',
        sources: [],
        error: `Perplexity API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('Perplexity response received:', JSON.stringify(data).slice(0, 200));

    const content = data.choices?.[0]?.message?.content || '';
    const citations: string[] = data.citations || [];

    const sources: PerplexitySource[] = citations.slice(0, 5).map((url: string, index: number) => {
      let title = '';
      try {
        const urlObj = new URL(url);
        title = urlObj.hostname.replace('www.', '');
      } catch {
        title = `Source ${index + 1}`;
      }
      return {
        title,
        url,
        snippet: '',
      };
    });

    return { content, sources };
  } catch (error) {
    console.error('Error calling Perplexity:', error);
    return {
      content: '',
      sources: [],
      error: 'Failed to search web content.',
    };
  }
}

export function buildSearchQuery(
  philosopherName: string,
  thoughtText: string,
  rootCause: string,
  lastMessage: string
): string {
  const topicKeywords = lastMessage.length > 10 ? lastMessage : thoughtText;
  return `${philosopherName} philosophy wisdom about: ${topicKeywords}. Root psychological theme: ${rootCause}`;
}
