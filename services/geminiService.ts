// FIX: Use the correct import for the Gemini API.
import { GoogleGenAI } from "@google/genai";
import { 
    ApiProvider, 
    type OutlineSection, 
    type ScriptPart, 
    type ApiKey, 
    type AIVNDHubSettings,
    type OpenRouterSettings,
    type ValidationStatus as ValidationStatusType,
    type CharacterProfile
} from '../types';

const API_KEY_STORAGE_KEY = 'llm-api-keys-list-v4';
const AIVNDHUB_SETTINGS_STORAGE_KEY = 'aivndhub-api-settings';
const OPENROUTER_SETTINGS_STORAGE_KEY = 'openrouter-api-settings';
const COOLDOWN_MS = 2000;

export const getAIVNDHubSettings = (): AIVNDHubSettings => {
    const storedSettings = localStorage.getItem(AIVNDHUB_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
        try {
            return JSON.parse(storedSettings);
        } catch (e) { console.error("Could not parse AIVND Hub settings", e); }
    }
    return { endpoint: 'https://onehub.aivnd.com/v1', model: 'gpt-4o' };
};

export const getOpenRouterSettings = (): OpenRouterSettings => {
    const storedSettings = localStorage.getItem(OPENROUTER_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
        try {
            return JSON.parse(storedSettings);
        } catch (e) { console.error("Could not parse OpenRouter settings", e); }
    }
    return { model: 'anthropic/claude-3.5-sonnet' };
};


const getApiKeys = (): ApiKey[] => {
    const encodedKeys = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!encodedKeys) return [];
    try {
        return JSON.parse(atob(encodedKeys));
    } catch (e) {
        console.error("Failed to parse API keys, clearing storage.", e);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        window.location.reload(); 
        return [];
    }
};

const saveApiKeys = (keys: ApiKey[]) => {
    try {
        const encodedKeys = btoa(JSON.stringify(keys));
        localStorage.setItem(API_KEY_STORAGE_KEY, encodedKeys);
    } catch (e) {
        console.error("Failed to save API keys.", e);
    }
};

const getLastUsedKeyIndex = (provider: ApiProvider): number => {
    const index = localStorage.getItem(`${provider.toLowerCase().replace(' ', '_')}_last_key_index`);
    return index ? parseInt(index, 10) : -1;
};

const setLastUsedKeyIndex = (provider: ApiProvider, index: number) => {
    localStorage.setItem(`${provider.toLowerCase().replace(' ', '_')}_last_key_index`, index.toString());
};

const normalizeEndpoint = (endpoint: string): string => {
    // This helper function ensures the final URL is clean.
    // Per user instruction, it NO LONGER appends /chat/completions automatically.
    // The user must provide the full, correct endpoint.
    let normalized = endpoint.trim();

    // Remove any trailing slash to create a consistent base.
    if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    
    return normalized;
};

type ValidationResult = {status: ValidationStatusType, message: string};
export async function validateApiKey(key: string, provider: ApiProvider, settings?: any): Promise<ValidationResult> {
    try {
        let responseText = '';
        const headers: HeadersInit = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
        };

        if (provider === ApiProvider.GEMINI) {
            // FIX: Updated to use the new @google/genai SDK syntax and recommended model.
            const ai = new GoogleGenAI({ apiKey: key });
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Hi'
            });
            responseText = result.text;
        } else {
            let url: string;
            let model: string;
            let body: any;

            switch(provider) {
                case ApiProvider.AIVND_HUB:
                    url = normalizeEndpoint(settings.endpoint) + '/chat/completions';
                    model = settings.model;
                    headers['HTTP-Referer'] = 'https://script-generator.aistudio.google.com/';
                    headers['X-Title'] = 'AI Documentary Script Generator';
                    body = { model, messages: [{role: 'user', content: 'Hi'}], max_tokens: 1 };
                    break;
                case ApiProvider.OPENAI:
                    url = 'https://api.openai.com/v1/chat/completions';
                    model = 'gpt-4o-mini';
                    body = { model, messages: [{role: 'user', content: 'Hi'}], max_tokens: 1 };
                    break;
                case ApiProvider.OPENROUTER:
                    url = 'https://openrouter.ai/api/v1/chat/completions';
                    model = settings.model;
                    headers['HTTP-Referer'] = 'https://script-generator.aistudio.google.com/';
                    headers['X-Title'] = 'AI Documentary Script Generator';
                    body = { model, messages: [{role: 'user', content: 'Hi'}], max_tokens: 1 };
                    break;
                default:
                    throw new Error("Provider không được hỗ trợ");
            }
            
            // For AIVND Hub, the user provides the base endpoint (e.g., .../v1). 
            // The API call itself must be made to the /chat/completions sub-path of that endpoint.
            // The user requested not to modify their saved endpoint string, so we append it here at call time.
            const finalUrl = provider === ApiProvider.AIVND_HUB ? normalizeEndpoint(settings.endpoint) + '/chat/completions' : url;


            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`[${response.status}] ${errorText}`);
            }
            const data = await response.json();
            responseText = data.choices[0]?.message?.content || 'ok';
        }
        
        if (!responseText.trim()) throw new Error('Phản hồi trống');
        return { status: 'valid', message: 'Hợp lệ' };

    } catch (err: any) {
        const errorMessage = err.message || String(err);
        console.error(`Validation failed for ${provider}:`, errorMessage);

        if (errorMessage.includes('401') || /unauthorized|invalid api key|令牌状态不可用|该令牌已过期/i.test(errorMessage)) {
            return { status: 'invalid', message: 'Không hợp lệ hoặc đã bị thu hồi (Lỗi 401)' };
        }
        // A 429 during a simple validation check is almost certainly a temporary rate limit, not a permanent quota exhaustion.
        // Classify it as such to avoid confusing the user with a "false" quota error.
        if (errorMessage.includes('429') || /resource_exhausted/i.test(errorMessage)) {
             return { status: 'rate_limited', message: 'Đã đạt giới hạn tần suất (Lỗi 429)' };
        }
        return { status: 'error', message: `Lỗi: ${errorMessage.substring(0, 100)}...` };
    }
}


async function makeApiRequest(
    prompt: string | { system: string; user:string },
    provider: ApiProvider,
    generationConfig?: any,
    model?: string
): Promise<string> {
    const allKeys = getApiKeys();
    const availableKeys = allKeys
        .filter(k => k.provider === provider)
        .filter(k => !(k.exhaustedUntil && k.exhaustedUntil > Date.now()));

    if (availableKeys.length === 0) {
        const exhaustedKeysExist = allKeys.some(k => k.provider === provider);
        if (exhaustedKeysExist) {
            throw new Error(`Tất cả API keys cho ${provider} đều đang trong thời gian chờ hoặc đã hết hạn ngạch. Vui lòng thử lại sau.`);
        }
        throw new Error(`Không có API Key nào được cấu hình cho ${provider}. Vui lòng vào phần cài đặt để thêm key.`);
    }

    const lastIndex = getLastUsedKeyIndex(provider);
    const startIndex = (lastIndex + 1) % availableKeys.length;
    
    const errorLogs: string[] = [];

    for (let i = 0; i < availableKeys.length; i++) {
        const currentIndexInAvailable = (startIndex + i) % availableKeys.length;
        const apiKey = availableKeys[currentIndexInAvailable];
        const keyIdentifier = `...${apiKey.key.slice(-4)}`;

        const now = Date.now();
        const timeSinceLastUse = now - apiKey.lastUsed;
        if (timeSinceLastUse < COOLDOWN_MS) {
            await new Promise(resolve => setTimeout(resolve, COOLDOWN_MS - timeSinceLastUse));
        }

        try {
            const originalKey = allKeys.find(k => k.key === apiKey.key);
            if(originalKey) {
                originalKey.lastUsed = Date.now();
                saveApiKeys(allKeys);
            }

            let responseText = '';
            
            if (provider === ApiProvider.GEMINI) {
                // FIX: Updated to use the new @google/genai SDK syntax and recommended model.
                const ai = new GoogleGenAI({ apiKey: apiKey.key });
                
                const config: any = { ...generationConfig };
                if (typeof prompt !== 'string' && prompt.system) {
                    config.systemInstruction = prompt.system;
                }

                const result = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: typeof prompt === 'string' ? prompt : prompt.user,
                    config,
                });
                responseText = result.text;

            } else { 
                let url: string;
                const headers: HeadersInit = {
                    'Authorization': `Bearer ${apiKey.key}`,
                    'Content-Type': 'application/json',
                };
                let effectiveModel = model;

                switch (provider) {
                    case ApiProvider.AIVND_HUB:
                        const aivndSettings = getAIVNDHubSettings();
                        // The user provides the base endpoint (e.g., .../v1). 
                        // The API call must be made to the /chat/completions sub-path.
                        url = normalizeEndpoint(aivndSettings.endpoint) + '/chat/completions';
                        if (!effectiveModel) effectiveModel = aivndSettings.model;
                        headers['HTTP-Referer'] = 'https://script-generator.aistudio.google.com/';
                        headers['X-Title'] = 'AI Documentary Script Generator';
                        break;
                    case ApiProvider.OPENAI:
                        url = 'https://api.openai.com/v1/chat/completions';
                        if (!effectiveModel) effectiveModel = 'gpt-4o-mini';
                        break;
                    case ApiProvider.OPENROUTER:
                        const openRouterSettings = getOpenRouterSettings();
                        url = 'https://openrouter.ai/api/v1/chat/completions';
                        if (!effectiveModel) effectiveModel = openRouterSettings.model;
                        headers['HTTP-Referer'] = 'https://script-generator.aistudio.google.com/';
                        headers['X-Title'] = 'AI Documentary Script Generator';
                        break;
                    default:
                        throw new Error(`Provider không được hỗ trợ: ${provider}`);
                }
                
                const body = {
                    model: effectiveModel,
                    messages: typeof prompt === 'string' 
                        ? [{ role: 'user', content: prompt }]
                        : [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                });
                
                if (!response.ok) {
                    let errorMessage = `Lỗi máy chủ với mã trạng thái ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error?.message || JSON.stringify(errorData);
                    } catch (e) {
                         try {
                            const textError = await response.text();
                            if (textError) errorMessage = textError;
                        } catch (e2) { /* Fallback to status text */ }
                    }
                     throw new Error(`[${response.status}] ${errorMessage}`);
                }
                
                const data = await response.json();
                responseText = data.choices[0]?.message?.content || '';
            }

            if (!responseText.trim()) {
                 throw new Error('API đã trả về một phản hồi trống.');
            }
            
            setLastUsedKeyIndex(provider, currentIndexInAvailable);
            return responseText.trim();

        } catch (err) {
            console.error(`Error with key ${keyIdentifier}:`, err);

            let processedErrorMessage: string;
            if (err instanceof Error) {
                processedErrorMessage = err.message;
            } else if (typeof err === 'object' && err !== null) {
                processedErrorMessage = (err as any).message || JSON.stringify(err);
            } else {
                processedErrorMessage = String(err);
            }

            const isAuthError = /401|unauthorized|invalid api key|令牌状态不可用|该令牌已过期/i.test(processedErrorMessage);
            const isRateLimitError = processedErrorMessage.includes('429') || /rate limit/i.test(processedErrorMessage);
            const isHardQuotaError = /quota|billing|insufficient_quota|resource_exhausted/i.test(processedErrorMessage) && !isRateLimitError;
            
            const originalKey = allKeys.find(k => k.key === apiKey.key);

            if (isAuthError) {
                if (originalKey) {
                    originalKey.exhaustedUntil = Date.now() + 365 * 24 * 60 * 60 * 1000;
                    saveApiKeys(allKeys);
                }
                errorLogs.push(`Key ${keyIdentifier}: Không hợp lệ hoặc đã bị thu hồi (Lỗi 401).`);
            } else if (isRateLimitError) {
                 if (originalKey) {
                    // Set a short cooldown for rate limits (e.g., 60 seconds)
                    originalKey.exhaustedUntil = Date.now() + 60 * 1000;
                    saveApiKeys(allKeys);
                }
                errorLogs.push(`Key ${keyIdentifier}: Đã đạt giới hạn tần suất (Lỗi 429). Sẽ thử lại sau ít phút.`);
            } else if (isHardQuotaError) {
                if (originalKey) {
                    // Keep the long cooldown for hard quota limits
                    originalKey.exhaustedUntil = Date.now() + 24 * 60 * 60 * 1000;
                    saveApiKeys(allKeys);
                }
                errorLogs.push(`Key ${keyIdentifier}: Hạn ngạch đã hết.`);
            } else {
                const displayMessage = processedErrorMessage.length > 150 ? processedErrorMessage.substring(0, 150) + '...' : processedErrorMessage;
                errorLogs.push(`Key ${keyIdentifier}: Lỗi - ${displayMessage}`);
            }
        }
    }

    const finalMessage = `Tất cả API keys cho ${provider} đều không thành công. Vui lòng kiểm tra lại key hoặc thử lại sau.\nChi tiết:\n- ${errorLogs.join('\n- ')}`;
    throw new Error(finalMessage);
}


export const generateOutline = async (title: string, character: CharacterProfile, provider: ApiProvider, model: string | undefined, language: string): Promise<string> => {
    
    const characterInfo = Object.entries(character)
        .filter(([, value]) => value && value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    
    const characterPrompt = characterInfo ? `\n\nThe protagonist has the following characteristics: ${characterInfo}. Ensure the story respects these details.` : '';
    
    const prompt = `You are an expert Japanese storyteller. Your task is to create a compelling story outline in ${language.toUpperCase()} based on the provided idea.

The story must revolve around the theme of an underestimated character who possesses extraordinary talent (an "ugly duckling to swan" story) or overcomes social prejudice. The story must evoke strong emotions: surprise, suspense, and ultimately, satisfaction.

STORY IDEA: "${title}"
${characterPrompt}

Now, create a detailed outline that strictly follows this mandatory 5-part structure. Do not change the structure.

**Part 1: The Shocking Opening (The Hook)**
*   **Goal:** Spark intense curiosity in the reader within the first few seconds.
*   **Content:** Place the protagonist in a seemingly mundane or normal situation where they are overlooked by others. Then, through an accidental or intentional action, the protagonist reveals a small detail of an extraordinary talent that is completely at odds with their appearance. This detail should make the reader ask, "Why?"

**Part 2: Raising the Stakes (The Pressure)**
*   **Goal:** Make the audience feel suspense and root for the protagonist.
*   **Content:** Establish a high-stakes situation or a major problem the protagonist must face. Crucially, clarify the consequences of failure. If the problem isn't solved, the protagonist will lose something incredibly important (e.g., their job, reputation, a life-changing opportunity, the safety of a loved one, etc.).

**Part 3: The Re-Hook (The Twist)**
*   **Goal:** Maintain tension and prevent the story from becoming predictable.
*   **Content:** As the protagonist tries to solve the problem, introduce a new complication, an unexpected truth, or a fresh obstacle. This twist should escalate the challenge and make the situation seem even more hopeless.

**Part 4: The Climax (The Emotional Explosion)**
*   **Goal:** Create the most satisfying moment for the audience.
*   **Content:** The protagonist, pushed into a corner, decides to use their full talent to solve the problem in the most public and spectacular way possible. This moment must shock and awe those who previously looked down on them, completely changing their perspective. This is the money shot of the entire story.

**Part 5: The End (The Meaningful Lesson)**
*   **Goal:** Leave a profound message and a sense of closure.
*   **Content:** Briefly describe the positive outcome the protagonist achieves after the climax. The story should conclude with a reflection or a meaningful message about not judging others by their appearance and the value of perseverance and self-belief.

---
**Output Format Rules:**
1.  **Language:** The entire outline, including section titles and descriptions, MUST be in ${language.toUpperCase()}.
2.  **Structure:** The outline must have exactly 5 sections, corresponding to the parts above.
3.  **Content:** Each section must have a compelling title, a target word and paragraph count, and a brief description (1-2 sentences) of the events in that part.
4.  **Targets:** The word count for each section must be between 700 and 1000 words. The paragraph count should be calculated based on a strict rule of 22-24 words per paragraph.
5.  **Format:** The output MUST strictly follow this example, using "---" to separate sections. Do not add any other text before or after the list.

[Part 1 Title]
Target: ~800 words / ~35 paragraphs
Description: [Brief description for Part 1]
---
[Part 2 Title]
Target: ~900 words / ~38 paragraphs
Description: [Brief description for Part 2]
---
...and so on for all 5 parts.`;

    return makeApiRequest(prompt, provider, { temperature: 0.7, topP: 0.95, topK: 40 }, model);
};

export const parseOutline = (outlineText: string): OutlineSection[] => {
  return outlineText.split('---')
    .map(part => part.trim())
    .filter(part => part)
    .map(part => {
      const lines = part.split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) return null;

      const title = lines[0]?.replace(/^\[|\]$/g, '').trim() || 'No Title';
      
      const targetLine = lines.find(line => /target:/i.test(line));
      const descriptionLine = lines.find(line => /description:/i.test(line));

      let wordTarget = '~800 words';
      let paragraphTarget = '~35 paragraphs';
      
      if (targetLine) {
        const targetMatch = targetLine.match(/~?\s*\d+\s*words/i);
        const paragraphMatch = targetLine.match(/~?\s*\d+\s*paragraphs/i);
        if (targetMatch) wordTarget = targetMatch[0].trim();
        if (paragraphMatch) paragraphTarget = paragraphMatch[0].trim();
      }
      
      const description = descriptionLine ? descriptionLine.split(/description:/i)[1]?.trim() : 'No description provided.';
      
      return { title, wordTarget, paragraphTarget, description };
    })
    .filter((section): section is OutlineSection => section !== null && section.title !== 'No Title' && section.description !== 'No description provided.');
};


export const generateScriptPart = async (
  title: string,
  outline: OutlineSection[],
  scriptParts: ScriptPart[],
  partIndex: number,
  character: CharacterProfile | null,
  provider: ApiProvider,
  model: string | undefined,
  language: string
): Promise<string> => {
  if (partIndex < 0 || partIndex >= outline.length) {
    throw new Error("Invalid part index provided.");
  }
  const currentSection = outline[partIndex];
  const targetWordCount = parseInt(currentSection.wordTarget.replace(/[^0-9]/g, ''), 10) || 800;
  const targetParagraphCount = parseInt(currentSection.paragraphTarget.replace(/[^0-9]/g, ''), 10) || 35;
  
  const previousPartsContext = scriptParts
    .slice(Math.max(0, partIndex - 2), partIndex)
    .map(part => part.content)
    .join('\n\n---\n\n');

  const characterInfo = character ? Object.entries(character)
    .filter(([, value]) => value && value.trim() !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ') : '';

  const characterInstruction = characterInfo ? `\n\n**PROTAGONIST PROFILE:** The main character has the following defined traits: ${characterInfo}. You MUST ensure the character's description and actions in the story are consistent with this profile.` : '';

  let systemPrompt = `You are an elite Japanese storyteller. Your task is to write a story part based on the provided theme, outline, and specific section details, adhering to the highest standards of narrative craft.
${characterInstruction}
**CRITICAL SCRIPT REQUIREMENTS - FOLLOW THESE EXACTLY:**

1.  **Language:** The entire script must be in **${language.toUpperCase()}**. Any Japanese names (people, places) must be written without diacritics.
2.  **Paragraph Word Count (ABSOLUTE RULE):** This is the most important rule. Every single paragraph **MUST** be strictly between 22 and 24 words long. There are absolutely **NO exceptions**. Before finalizing your response, you must review every paragraph to ensure it meets this exact word count.
3.  **Paragraph Formatting (ABSOLUTE RULE):**
    *   Do **NOT** number the paragraphs. Each paragraph should be plain text.
    *   Separate each paragraph with a single blank line (two newlines).
4.  **Header & Footer Format:** The output for each part **MUST** start with a header and end with a footer. Do not add any text before the header or after the footer. If the target language is not English, you MUST translate the header/footer labels (e.g., "Part", "Word count", "Paragraphs") into the target language.
    *   **Part Header Format (First Line):** \`[SECTION TITLE] – Part X (Word count/Paragraph count)\` (Use the target word/paragraph count from the outline for this header).
    *   **Part Footer Format (Last Line):** \`Word count: [X] | Paragraphs: [Y]\` (You will calculate the final actual Word count and Paragraph count and fill them in).
5.  **Logical Grounding:** Even if the story has dramatic elements, it must maintain a logical foundation that is easy for the audience to follow. Avoid overly fantastical or unrealistic solutions.

---

**ADVANCED NARRATIVE & CINEMATIC TECHNIQUE:**

**I. Core Principle: "Show, Don't Tell" (Evocative Description)**
*   Instead of stating emotions or facts (e.g., "The hero was worried"), describe actions and sensory details that reveal them. Describe the restless tapping of his fingers, the grim set of his jaw, the smell of rain on pavement. Make the audience *feel* the story.

**II. Deep Characters**
*   Treat key characters as complex individuals. Identify their core **Goal** (what they want), **Motivation** (the deep reason why they want it), and the primary **Conflict** they face.
*   The antagonists and doubters should not be pure evil. Their actions must be driven by understandable, even if flawed, reasons.
*   Expose critical **Flaws** in the protagonist (e.g., self-doubt, pride, naivety). Show, through their actions, how these flaws impact their journey and create drama.

**III. Plot, Conflict, and Thematic Structure**
*   **Raise the Stakes:** Constantly emphasize what is at risk. What are the dire consequences of failure? What is the ultimate prize for success? Make the audience understand the immense weight of the events.
*   **Conflict in Every Part:** Each part of the story must have its own central conflict—be it a social struggle, an internal debate, or a race against time. This conflict must drive the narrative forward.
*   **Thematic Cohesion:** Keep the story's central theme (e.g., 'the true meaning of talent,' 'overcoming prejudice') in mind. Weave in details and narrative choices that subtly reinforce this theme.

**IV. Narration: Sharp, Purposeful, and Evocative**
*   **Purposeful Narration:** Every sentence must serve a purpose: reveal character, advance the plot, or provide essential information. Eliminate any generic or unnecessary narration.
*   **Subtext and Nuance:** Avoid stating the obvious. Hint at deeper meanings. For instance, instead of saying "they didn't believe him," describe their subtle smirks and dismissive gestures.

**V. Pacing and Structure**
*   **Fast Pacing:** Avoid long, unnecessary descriptions. Focus on action, dialogue, and events that push the story forward.
*   **Hooks and Bridges:** Part 1 **MUST** have a strong opening hook. The Final Part **MUST** have a clear meaningful lesson. Every other part must start with its own mini-hook and end with a narrative bridge that creates anticipation for the next part.

---

**EXAMPLE OF A PERFECTLY FORMATTED OUTPUT (This example is in English; adapt the format to your target language as instructed):**

THE SILENT BLADE – Part 3 (820/37)

His rivals mocked him openly in the dojo, their laughter echoing off the worn wooden floors as they practiced their flashy, popular styles.

Each taunt was a stone added to the wall of doubt in his mind, yet he clung to his grandfather's simple, forgotten teachings.

The tournament announcement was a shock, a sudden chance to prove that true strength didn't always need to be loud and ostentatious.
...
Word count: 819 | Paragraphs: 37
---

Your entire output must follow this structure PERFECTLY.`;

    if (partIndex === 0) {
        systemPrompt += `

**SPECIAL INSTRUCTION FOR PART 1:** This is the beginning of the story. You **MUST** create a powerful opening hook as instructed in the main requirements. The first few paragraphs must be exceptionally compelling.`;
    } else if (partIndex === outline.length - 1) {
        systemPrompt += `

**SPECIAL INSTRUCTION FOR FINAL PART:** This is the end of the story. You **MUST** conclude the narrative and include a clear, meaningful lesson in the final paragraphs.`;
    }

  const userPrompt = `**STORY IDEA:** "${title}"

**FULL STORY OUTLINE:**
${outline.map((s, i) => `Part ${i + 1}: ${s.title} (${s.wordTarget} / ${s.paragraphTarget}) - ${s.description}`).join('\n')}

**CONTEXT FROM PREVIOUS PARTS:**
${previousPartsContext || 'This is the first part, so there is no previous context.'}

**CURRENT TASK:**
Write the script for **Part ${partIndex + 1}: ${currentSection.title}**.
- Description for this part: "${currentSection.description}".
- Target: Approximately ${targetWordCount} words / ${targetParagraphCount} paragraphs.
- Remember all critical requirements from the system instructions, especially the **REMOVAL of paragraph numbering** and the strict 22-24 word count per paragraph.

Now, generate the script for this part PERFECTLY.`;

  const promptObject = { system: systemPrompt, user: userPrompt };
  const geminiConfig = { temperature: 0.8, topP: 0.95, topK: 50 };
  
  if (provider === ApiProvider.GEMINI) {
      return makeApiRequest(promptObject, provider, geminiConfig);
  } else {
      return makeApiRequest(promptObject, provider, undefined, model);
  }
};

export const generateReferenceCharacter = async (title: string, provider: ApiProvider, model: string | undefined, language: string): Promise<string> => {
    const prompt = `You are a character concept artist creating a visual reference for an image generation AI. Your task is to generate a detailed description of a main character based on a story idea, written in ${language.toUpperCase()}.

This description is NOT for the script. It is a visual guide for creating an image of the character. Be specific, creative, and evocative.

**Story Idea:** "${title}"

Based on this idea, generate a character description covering the following elements. Provide a brief justification for your choices to connect them to the story's theme.

**Output Format (Strictly follow this, translate labels to ${language.toUpperCase()}):**

**Nhân Vật Tham Khảo**

*   **Quốc tịch:** [Character's Nationality]
*   **Độ tuổi:** [Character's Age]
*   **Màu da:** [Character's Skin Color]
*   **Kiểu tóc:** [Long or Short, Style]
*   **Màu tóc:** [Hair Color]
*   **Trang phục (Áo):** [Type of shirt, Color]
*   **Trang phục (Quần):** [Type of pants, Color]

**Lý do thiết kế:**
[Provide a 2-3 sentence justification explaining how this visual design (age, clothing, etc.) reflects the character's personality, circumstances, or the core theme of the story idea provided.]
`;
    const geminiConfig = { temperature: 0.9, topP: 0.95, topK: 64 };
    
    if (provider === ApiProvider.GEMINI) {
        return makeApiRequest(prompt, provider, geminiConfig);
    } else {
        return makeApiRequest(prompt, provider, undefined, model);
    }
};

export const analyzeCharactersFromScript = async (
    fullScript: string,
    provider: ApiProvider,
    model: string | undefined,
    language: string
): Promise<string> => {
    const prompt = {
        system: `You are a character profiler AI. Your task is to read the provided script and generate a detailed physical description for every character, formatted as a single, comma-separated line. Your output will be used to generate character images.

Analyze the entire script to identify all characters. For each character, you must provide a summary of their appearance.

**RULES:**
1.  **Language:** The entire output MUST be in ${language.toUpperCase()}. All labels MUST be translated to the target language if it's not Vietnamese.
2.  **Format:** For each character, you must generate a single block of text with two lines:
    *   Line 1: The character's name, formatted as a Markdown heading (e.g., \`### Character Name\`).
    *   Line 2: A single line of comma-separated key-value pairs for all attributes. DO NOT use a bulleted list.
3.  **Content:** The comma-separated line MUST contain the following attributes in this exact order. Do NOT add any other information like personality or role.
    *   **Quốc tịch:** [Nationality]
    *   **Độ tuổi:** [Age]
    *   **Chiều cao:** [e.g., Cao, Thấp, Trung bình]
    *   **Vóc dáng:** [e.g., Gầy, Béo, Cân đối]
    *   **Màu da:** [Skin Color]
    *   **Kiểu tóc:** [Hair style, e.g., Tóc dài, Tóc ngắn]
    *   **Màu tóc:** [Hair Color]
    *   **Trang phục (Áo):** [Detailed shirt description, color]
    *   **Trang phục (Quần):** [Detailed pants description, color, e.g., Quần tây dài màu đen]
4.  **Inference:** If a specific detail is not explicitly mentioned in the script, make a logical inference based on the character's context, name, and actions. For example, if a character is named "Kenji" and works in a Tokyo office, infer their nationality is Japanese. If their age isn't stated, estimate it based on their profession.

**EXAMPLE OUTPUT FORMAT (VIETNAMESE):**

### Ông Lão
Quốc tịch: Việt Nam, Độ tuổi: Khoảng 75, Chiều cao: Thấp, Vóc dáng: Gầy, Màu da: Vàng, Kiểu tóc: Tóc ngắn bạc phơ, Màu tóc: Trắng, Trang phục (Áo): Áo sơ mi cũ màu nâu, Trang phục (Quần): Quần vải dài màu đen

### Quản lý Hùng
Quốc tịch: Nhật Bản, Độ tuổi: Khoảng 40, Chiều cao: Trung bình, Vóc dáng: Cân đối, Màu da: Da sáng, Kiểu tóc: Tóc ngắn gọn gàng, Màu tóc: Đen, Trang phục (Áo): Áo vest công sở màu xám, Trang phục (Quần): Quần tây dài màu xám
`,
        user: `**SCRIPT TO ANALYZE:**
---
${fullScript}
---

Now, provide the character analysis based on the script above, strictly following all the rules. Do not include any text before or after the analysis.`
    };

    const geminiConfig = { temperature: 0.5 };
    
    if (provider === ApiProvider.GEMINI) {
        return makeApiRequest(prompt, provider, geminiConfig);
    } else {
        return makeApiRequest(prompt, provider, undefined, model);
    }
};