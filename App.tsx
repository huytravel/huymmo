
import React, { useState, useEffect, useRef } from 'react';
import type { OutlineSection, ScriptPart, ApiKey, CharacterProfile } from './types';
import { ApiProvider } from './types';
import { generateOutline, parseOutline, generateScriptPart, getAIVNDHubSettings, getOpenRouterSettings, generateReferenceCharacter, analyzeCharactersFromScript } from './services/geminiService';
import Header from './components/Header';
import ScriptForm from './components/ScriptForm';
import ScriptDisplay from './components/ScriptDisplay';
import Loader from './components/Loader';
import ApiKeyForm, { openRouterModels, aivndHubModels, openAIModels } from './components/ApiKeyForm';
import CharacterReferenceModal from './components/CharacterReferenceModal';

const getInitialProvider = (): ApiProvider => {
    const encodedKeys = localStorage.getItem('llm-api-keys-list-v4');
    if (encodedKeys) {
        try {
            const allKeys: ApiKey[] = JSON.parse(atob(encodedKeys));
            const providers = new Set(allKeys.map(k => k.provider));
            if (providers.has(ApiProvider.GEMINI)) return ApiProvider.GEMINI;
            if (providers.has(ApiProvider.AIVND_HUB)) return ApiProvider.AIVND_HUB;
            if (providers.has(ApiProvider.OPENAI)) return ApiProvider.OPENAI;
            if (providers.has(ApiProvider.OPENROUTER)) return ApiProvider.OPENROUTER;
        } catch (e) {
            console.error("Could not parse API keys to set initial provider:", e);
        }
    }
    return ApiProvider.GEMINI;
};

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!localStorage.getItem('llm-api-keys-list-v4'));
  const [title, setTitle] = useState<string>('');
  const [character, setCharacter] = useState<CharacterProfile>({
    nationality: '',
    age: '',
    skinColor: '',
    hairLength: '',
    hairColor: '',
    shirt: '',
    pants: '',
  });
  const [storyCharacter, setStoryCharacter] = useState<CharacterProfile | null>(null);

  const [outline, setOutline] = useState<OutlineSection[] | null>(null);
  const [scriptParts, setScriptParts] = useState<ScriptPart[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPart, setIsGeneratingPart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(false);
  const [delayTimer, setDelayTimer] = useState<number | null>(null);
  const timerIdRef = useRef<number | null>(null);
  
  const [apiProvider, setApiProvider] = useState<ApiProvider>(getInitialProvider);
  const [aivndHubModel, setAivndHubModel] = useState<string>(() => getAIVNDHubSettings().model);
  const [openAIModel, setOpenAIModel] = useState<string>(openAIModels[0].id);
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => getOpenRouterSettings().model);
  const [language, setLanguage] = useState<string>('Vietnamese');

  const [scriptApiProvider, setScriptApiProvider] = useState<ApiProvider>(apiProvider);
  const [scriptAivndHubModel, setScriptAivndHubModel] = useState<string>(aivndHubModel);
  const [scriptOpenAIModel, setScriptOpenAIModel] = useState<string>(openAIModel);
  const [scriptOpenRouterModel, setScriptOpenRouterModel] = useState<string>(openRouterModel);
  
  const [referenceCharacterDescription, setReferenceCharacterDescription] = useState<string | null>(null);
  const [isLoadingReferenceCharacter, setIsLoadingReferenceCharacter] = useState<boolean>(false);
  
  const [characterAnalysisResult, setCharacterAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingCharacters, setIsAnalyzingCharacters] = useState<boolean>(false);

  useEffect(() => {
    if (outline) {
      setScriptApiProvider(apiProvider);
      setScriptAivndHubModel(aivndHubModel);
      setScriptOpenAIModel(openAIModel);
      setScriptOpenRouterModel(openRouterModel);
    }
  }, [outline, apiProvider, aivndHubModel, openAIModel, openRouterModel]);

  const handleApiKeySaved = () => {
    setApiProvider(getInitialProvider());
    const newAivndSettings = getAIVNDHubSettings();
    const newOpenRouterSettings = getOpenRouterSettings();
    setAivndHubModel(newAivndSettings.model);
    setOpenRouterModel(newAivndSettings.model);
    setHasApiKey(true);
  };

  const handleGoToSettings = () => {
    setIsAutoGenerating(false);
    setHasApiKey(false);
  };

  const handleGenerateOutline = async (newTitle: string, newCharacter: CharacterProfile) => {
    if (!newTitle.trim()) {
      setError('Vui lòng nhập ý tưởng cho câu chuyện của bạn.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setOutline(null);
    setScriptParts([]);
    setTitle(newTitle);
    setStoryCharacter(newCharacter);
    setCharacterAnalysisResult(null);
    setIsAnalyzingCharacters(false);

    try {
      let modelToUse: string | undefined;
      switch(apiProvider) {
          case ApiProvider.AIVND_HUB: modelToUse = aivndHubModel; break;
          case ApiProvider.OPENAI: modelToUse = openAIModel; break;
          case ApiProvider.OPENROUTER: modelToUse = openRouterModel; break;
          default: modelToUse = undefined;
      }

      const outlineText = await generateOutline(newTitle, newCharacter, apiProvider, modelToUse, language);
      const parsedOutline = parseOutline(outlineText);
      if (parsedOutline.length === 0) {
        throw new Error("Không thể phân tích dàn ý. AI có thể đã trả về một định dạng không mong muốn. Vui lòng thử lại.");
      }
      setOutline(parsedOutline);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReferenceCharacter = async (storyIdea: string) => {
    if (!storyIdea.trim()) {
        setError('Vui lòng nhập ý tưởng trước khi tạo gợi ý nhân vật.');
        return;
    }
    setIsLoadingReferenceCharacter(true);
    setError(null);
    setReferenceCharacterDescription(null); // Clear previous description

    try {
        let modelToUse: string | undefined;
        switch(apiProvider) {
            case ApiProvider.AIVND_HUB: modelToUse = aivndHubModel; break;
            case ApiProvider.OPENAI: modelToUse = openAIModel; break;
            case ApiProvider.OPENROUTER: modelToUse = openRouterModel; break;
            default: modelToUse = undefined;
        }
        const description = await generateReferenceCharacter(storyIdea, apiProvider, modelToUse, language);
        setReferenceCharacterDescription(description);
    } catch (err: any) {
        setError(err.message || 'Không thể tạo mô tả nhân vật.');
    } finally {
        setIsLoadingReferenceCharacter(false);
    }
  };

  // FIX: Initialize useRef with a value (e.g., null) as it expects an argument for the given type.
  const generateNextPartRef = useRef<(() => Promise<void>) | null>(null);

  const generateNextPart = async () => {
    if (!outline || scriptParts.length >= outline.length) {
      setIsAutoGenerating(false);
      return;
    }

    setIsGeneratingPart(true);
    setError(null);

    try {
      let modelToUse: string | undefined;
      switch(scriptApiProvider) {
          case ApiProvider.AIVND_HUB: modelToUse = scriptAivndHubModel; break;
          case ApiProvider.OPENAI: modelToUse = scriptOpenAIModel; break;
          case ApiProvider.OPENROUTER: modelToUse = scriptOpenRouterModel; break;
          default: modelToUse = undefined;
      }
      const newPartContent = await generateScriptPart(title, outline, scriptParts, scriptParts.length, storyCharacter, scriptApiProvider, modelToUse, language);
      setScriptParts(prev => [...prev, { content: newPartContent }]);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo phần kịch bản.');
      setIsAutoGenerating(false);
    } finally {
      setIsGeneratingPart(false);
    }
  };
  
  generateNextPartRef.current = generateNextPart;

  useEffect(() => {
    if (isAutoGenerating && !isGeneratingPart && scriptParts.length < (outline?.length ?? 0)) {
      const startTimer = () => {
        setDelayTimer(2);
        timerIdRef.current = window.setInterval(() => {
          setDelayTimer(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(timerIdRef.current!);
              timerIdRef.current = null;
              // FIX: The error "Expected 1 arguments, but got 0" likely stems from a linter rule against side effects
              // within a state updater. State updaters should be pure. By wrapping the side effect (the API call)
              // in a `setTimeout`, we schedule it to run after the current render cycle, thus making the updater pure.
              setTimeout(() => generateNextPartRef.current?.(), 0);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      };
      startTimer();
    } else if (!isAutoGenerating && timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
      setDelayTimer(null);
    }

    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [isAutoGenerating, isGeneratingPart, scriptParts.length, outline?.length]);
  
  const isComplete = outline && scriptParts.length === outline.length && scriptParts.length > 0;

  useEffect(() => {
    if (isComplete && !characterAnalysisResult && !isAnalyzingCharacters) {
      const analyzeCharacters = async () => {
        setIsAnalyzingCharacters(true);
        setError(null);
        try {
            const fullScript = scriptParts.map(part => part.content).join('\n\n---\n\n');
            let modelToUse: string | undefined;
            switch(scriptApiProvider) {
                case ApiProvider.AIVND_HUB: modelToUse = scriptAivndHubModel; break;
                case ApiProvider.OPENAI: modelToUse = scriptOpenAIModel; break;
                case ApiProvider.OPENROUTER: modelToUse = scriptOpenRouterModel; break;
                default: modelToUse = undefined;
            }
            const result = await analyzeCharactersFromScript(fullScript, scriptApiProvider, modelToUse, language);
            setCharacterAnalysisResult(result);
        } catch (err: any) {
            setError(`Không thể phân tích nhân vật: ${err.message}`);
        } finally {
            setIsAnalyzingCharacters(false);
        }
      };
      analyzeCharacters();
    }
  }, [isComplete, characterAnalysisResult, isAnalyzingCharacters, scriptParts, scriptApiProvider, scriptAivndHubModel, scriptOpenAIModel, scriptOpenRouterModel, language]);


  const handleReset = () => {
    setTitle('');
    setCharacter({
        nationality: '', age: '', skinColor: '', hairLength: '',
        hairColor: '', shirt: '', pants: ''
    });
    setStoryCharacter(null);
    setOutline(null);
    setScriptParts([]);
    setIsLoading(false);
    setError(null);
    setIsAutoGenerating(false);
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setDelayTimer(null);
    setCharacterAnalysisResult(null);
    setIsAnalyzingCharacters(false);
  };
  
  const handleRegenerateOutline = () => {
    if (title) {
        setCharacterAnalysisResult(null);
        setIsAnalyzingCharacters(false);
        const currentCharacter = storyCharacter || character;
        handleGenerateOutline(title, currentCharacter);
    }
  };

  const handleDownload = () => {
    const fullScript = scriptParts.map(part => part.content).join('\n\n---\n\n');
    const blob = new Blob([fullScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/ /g, '_')}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleAutoGenerate = () => {
    setIsAutoGenerating(prev => !prev);
  };
  
  const languages = [
    { code: 'Vietnamese', name: 'Tiếng Việt' },
    { code: 'English', name: 'English' },
    { code: 'Japanese', name: '日本語' },
    { code: 'Korean', name: '한국어' },
    { code: 'Chinese', name: '中文' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Russian', name: 'Русский' },
    { code: 'Portuguese', name: 'Português' },
  ];

  if (!hasApiKey) {
    return <ApiKeyForm onKeySaved={handleApiKeySaved} />;
  }

  return (
    <>
      <Header onGoToSettings={handleGoToSettings} />
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        {!outline && !isLoading && (
          <div className="max-w-3xl mx-auto animate-fade-in">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                 <div>
                    <label htmlFor="provider-select" className="block text-sm font-medium text-cyan-300 mb-2">Chọn nhà cung cấp AI</label>
                    <select
                        id="provider-select"
                        value={apiProvider}
                        onChange={(e) => setApiProvider(e.target.value as ApiProvider)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
                    >
                        <option value={ApiProvider.GEMINI}>Gemini</option>
                        <option value={ApiProvider.AIVND_HUB}>AIVND Hub</option>
                        <option value={ApiProvider.OPENAI}>OpenAI</option>
                        <option value={ApiProvider.OPENROUTER}>OpenRouter</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-cyan-300 mb-2">Chọn ngôn ngữ</label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
                    >
                        {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                </div>
            </div>
             {apiProvider === ApiProvider.AIVND_HUB && (
              <div className="mb-6">
                <label htmlFor="aivnd-model-select" className="block text-sm font-medium text-cyan-300 mb-2">Chọn Model AIVND Hub</label>
                <select
                    id="aivnd-model-select"
                    value={aivndHubModel}
                    onChange={(e) => setAivndHubModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
                >
                  {aivndHubModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            )}
             {apiProvider === ApiProvider.OPENAI && (
              <div className="mb-6">
                <label htmlFor="openai-model-select" className="block text-sm font-medium text-cyan-300 mb-2">Chọn Model OpenAI</label>
                <select
                    id="openai-model-select"
                    value={openAIModel}
                    onChange={(e) => setOpenAIModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
                >
                  {openAIModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            )}
             {apiProvider === ApiProvider.OPENROUTER && (
              <div className="mb-6">
                <label htmlFor="openrouter-model-select" className="block text-sm font-medium text-cyan-300 mb-2">Chọn Model OpenRouter</label>
                <select
                    id="openrouter-model-select"
                    value={openRouterModel}
                    onChange={(e) => setOpenRouterModel(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
                >
                  {openRouterModels.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            )}
            <ScriptForm 
              onSubmit={handleGenerateOutline} 
              onGenerateReferenceCharacter={handleGenerateReferenceCharacter}
              isLoading={isLoading || isLoadingReferenceCharacter} 
              initialCharacter={character}
            />
          </div>
        )}
        {isLoading && <Loader />}
        {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center whitespace-pre-wrap">{error}</div>}
        {outline && (
          <ScriptDisplay
            title={title}
            outline={outline}
            scriptParts={scriptParts}
            onReset={handleReset}
            onDownload={handleDownload}
            onToggleAutoGenerate={handleToggleAutoGenerate}
            onRegenerateOutline={handleRegenerateOutline}
            isGeneratingPart={isGeneratingPart}
            isAutoGenerating={isAutoGenerating}
            isComplete={!!isComplete}
            delayTimer={delayTimer}
            scriptApiProvider={scriptApiProvider}
            setScriptApiProvider={setScriptApiProvider}
            scriptAivndHubModel={scriptAivndHubModel}
            setScriptAivndHubModel={setScriptAivndHubModel}
            scriptOpenAIModel={scriptOpenAIModel}
            setScriptOpenAIModel={setScriptOpenAIModel}
            scriptOpenRouterModel={scriptOpenRouterModel}
            setScriptOpenRouterModel={setScriptOpenRouterModel}
            characterAnalysisResult={characterAnalysisResult}
            isAnalyzingCharacters={isAnalyzingCharacters}
          />
        )}
      </main>
      <CharacterReferenceModal
        description={referenceCharacterDescription}
        isLoading={isLoadingReferenceCharacter}
        onClose={() => setReferenceCharacterDescription(null)}
        language={language}
      />
    </>
  );
};

export default App;
