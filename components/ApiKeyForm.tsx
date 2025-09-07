// Fix: Corrected the React import to properly include useState and useEffect.
import React, { useState, useEffect } from 'react';
import { ApiProvider, type ApiKey, type AIVNDHubSettings, type OpenRouterSettings, type ValidationStatus, type StatusObject } from '../types';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyFormProps {
  onKeySaved: () => void;
}

const API_KEY_STORAGE_KEY = 'llm-api-keys-list-v4';
const AIVNDHUB_SETTINGS_STORAGE_KEY = 'aivndhub-api-settings';
const OPENROUTER_SETTINGS_STORAGE_KEY = 'openrouter-api-settings';

export const aivndHubModels = [
  { id: 'gpt-4o', name: 'gpt-4o' },
  { id: 'gpt-4.1', name: 'gpt-4.1' },
];

export const openAIModels = [
  { id: 'gpt-4o', name: 'gpt-4o' },
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
  { id: 'gpt-4-turbo', name: 'gpt-4-turbo' },
];

// Fix: Updated OpenRouter model list to use current recommended models and remove deprecated ones.
export const openRouterModels = [
  // High-performance models
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
  { id: 'openai/gpt-4.1', name: 'OpenAI: GPT-4.1' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Meta: Llama 3.1 70B' },
  { id: 'deepseek/deepseek-v2-chat', name: 'DeepSeek: V2 Chat' },
  { id: 'mistralai/mistral-large', name: 'Mistral: Mistral Large' },

  // Cost-effective / smaller models
  { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o Mini' },
  { id: 'anthropic/claude-3-haiku', name: 'Anthropic: Claude 3 Haiku' },
  { id: 'google/gemini-2.5-flash', name: 'Google: Gemini 2.5 Flash' },
  { id: 'deepseek/chat', name: 'DeepSeek: V1 Chat' },
  
  // Free models
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Meta: Llama 3 8B (Free)' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral: 7B Instruct (Free)' },
  { id: 'google/gemma-7b-it', name: 'Google: Gemma 7B (Free)' },
  { id: 'microsoft/phi-3-mini-128k-instruct', name: 'Microsoft: Phi-3 Mini (Free)' },
];

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onKeySaved }) => {
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [activeTab, setActiveTab] = useState<ApiProvider>(ApiProvider.GEMINI);
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [geminiKeys, setGeminiKeys] = useState('');
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [aivndHubKeys, setAivndHubKeys] = useState('');
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [openAIKeys, setOpenAIKeys] = useState('');
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [openRouterKeys, setOpenRouterKeys] = useState('');
  
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [aivndHubEndpoint, setAivndHubEndpoint] = useState('https://onehub.aivnd.com/v1');
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [aivndHubModel, setAivndHubModel] = useState(aivndHubModels[0].id);
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [openRouterModel, setOpenRouterModel] = useState(openRouterModels[0].id);
  
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [validationStatus, setValidationStatus] = useState<Record<string, StatusObject>>({});
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [isTesting, setIsTesting] = useState(false);
  // Fix: Replaced 'aistudio.useState' with 'useState' from React import.
  const [error, setError] = useState<string | null>(null);

  // Fix: Replaced 'aistudio.useEffect' with 'useEffect' from React import.
  useEffect(() => {
    const encodedKeys = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (encodedKeys) {
      try {
        const allKeys: ApiKey[] = JSON.parse(atob(encodedKeys));
        setGeminiKeys(allKeys.filter(k => k.provider === ApiProvider.GEMINI).map(k => k.key).join('\n'));
        setAivndHubKeys(allKeys.filter(k => k.provider === ApiProvider.AIVND_HUB).map(k => k.key).join('\n'));
        setOpenAIKeys(allKeys.filter(k => k.provider === ApiProvider.OPENAI).map(k => k.key).join('\n'));
        setOpenRouterKeys(allKeys.filter(k => k.provider === ApiProvider.OPENROUTER).map(k => k.key).join('\n'));
      } catch (e) {
        console.error("Failed to parse existing API keys.", e);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    }

    const aivndSettings = localStorage.getItem(AIVNDHUB_SETTINGS_STORAGE_KEY);
    if (aivndSettings) {
        try {
            const settings: AIVNDHubSettings = JSON.parse(aivndSettings);
            setAivndHubEndpoint(settings.endpoint);
            setAivndHubModel(settings.model);
        } catch (e) { console.error("Could not parse AIVND Hub settings", e); }
    }

    const openRouterSettings = localStorage.getItem(OPENROUTER_SETTINGS_STORAGE_KEY);
    if (openRouterSettings) {
        try {
            const settings: OpenRouterSettings = JSON.parse(openRouterSettings);
            setOpenRouterModel(settings.model);
        } catch (e) { console.error("Could not parse OpenRouter settings", e); }
    }
  }, []);

  const handleSaveClick = () => {
    setError(null);
    const allKeys: ApiKey[] = [];
    geminiKeys.split('\n').map(k => k.trim()).filter(Boolean).forEach(key => allKeys.push({ key, provider: ApiProvider.GEMINI, lastUsed: 0 }));
    aivndHubKeys.split('\n').map(k => k.trim()).filter(Boolean).forEach(key => allKeys.push({ key, provider: ApiProvider.AIVND_HUB, lastUsed: 0 }));
    openAIKeys.split('\n').map(k => k.trim()).filter(Boolean).forEach(key => allKeys.push({ key, provider: ApiProvider.OPENAI, lastUsed: 0 }));
    openRouterKeys.split('\n').map(k => k.trim()).filter(Boolean).forEach(key => allKeys.push({ key, provider: ApiProvider.OPENROUTER, lastUsed: 0 }));

    if (allKeys.length === 0) {
      setError('Vui lòng nhập ít nhất một API Key hợp lệ.');
      return;
    }
    
    localStorage.setItem(API_KEY_STORAGE_KEY, btoa(JSON.stringify(allKeys)));
    
    const aivndSettings: AIVNDHubSettings = { endpoint: aivndHubEndpoint.trim(), model: aivndHubModel };
    localStorage.setItem(AIVNDHUB_SETTINGS_STORAGE_KEY, JSON.stringify(aivndSettings));

    const openRouterSettings: OpenRouterSettings = { model: openRouterModel };
    localStorage.setItem(OPENROUTER_SETTINGS_STORAGE_KEY, JSON.stringify(openRouterSettings));
    
    onKeySaved();
  };
  
    const getAllKeysFromStorage = (): ApiKey[] => {
        const encodedKeys = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (encodedKeys) {
            try {
                return JSON.parse(atob(encodedKeys));
            } catch (e) {
                console.error("Failed to parse existing API keys for validation.", e);
                return [];
            }
        }
        return [];
    };

  const handleTestKeys = async () => {
    setIsTesting(true);
    setValidationStatus({});
    
    let keysToTest: string[] = [];
    let settings: any = {};
    
    switch(activeTab) {
        case ApiProvider.GEMINI: keysToTest = geminiKeys.split('\n'); break;
        case ApiProvider.AIVND_HUB:
            keysToTest = aivndHubKeys.split('\n');
            settings = { endpoint: aivndHubEndpoint, model: aivndHubModel };
            break;
        case ApiProvider.OPENAI: keysToTest = openAIKeys.split('\n'); break;
        case ApiProvider.OPENROUTER:
            keysToTest = openRouterKeys.split('\n');
            settings = { model: openRouterModel };
            break;
    }

    const uniqueKeys = [...new Set(keysToTest.map(k => k.trim()).filter(Boolean))];
    const allStoredKeys = getAllKeysFromStorage();

    for (let i = 0; i < uniqueKeys.length; i++) {
        const key = uniqueKeys[i];
        
        // Fix: Increased delay to 4.1 seconds to stay safely within Gemini's strictest rate limits (e.g., 15 RPM).
        if (i > 0 && activeTab === ApiProvider.GEMINI) {
            await new Promise(resolve => setTimeout(resolve, 4100));
        }
        
        const storedKey = allStoredKeys.find(k => k.key === key && k.provider === activeTab);

        if (storedKey?.exhaustedUntil && storedKey.exhaustedUntil > Date.now()) {
            const remainingSeconds = Math.round((storedKey.exhaustedUntil - Date.now()) / 1000);
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            const message = remainingSeconds > 120 
                ? `Đang chờ (~${remainingMinutes} phút)` 
                : `Đang chờ (~${remainingSeconds} giây)`;
            
            setValidationStatus(prev => ({ ...prev, [key]: { status: 'cooldown', message } }));
            continue; // Skip the API call for this key
        }

        setValidationStatus(prev => ({...prev, [key]: {status: 'pending', message: 'Đang kiểm tra...'}})));
        const result = await validateApiKey(key, activeTab, settings);
        setValidationStatus(prev => ({...prev, [key]: result}));
    }

    setIsTesting(false);
  };

  const getStatusColor = (status: ValidationStatus) => {
    switch (status) {
        case 'valid': return 'text-green-400';
        case 'invalid': return 'text-red-400';
        case 'quota': return 'text-yellow-400';
        case 'rate_limited': return 'text-orange-400';
        case 'cooldown': return 'text-orange-400';
        case 'error': return 'text-red-500';
        case 'pending': return 'text-cyan-400 animate-pulse';
        default: return 'text-gray-500';
    }
  }

  const TabButton: React.FC<{provider: ApiProvider, children: React.ReactNode}> = ({ provider, children }) => (
    <button
      onClick={() => { setActiveTab(provider); setValidationStatus({}); }}
      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors duration-200 w-full ${
        activeTab === provider
          ? 'bg-gray-700 text-cyan-300 border-b-2 border-cyan-400'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {children}
    </button>
  );

  const renderValidationResults = (keys: string[]) => {
    const uniqueKeys = [...new Set(keys.map(k => k.trim()).filter(Boolean))];
    if (Object.keys(validationStatus).length === 0 && !isTesting) return null;
    
    return (
      <div className="mt-3 space-y-1 text-xs">
        {uniqueKeys.map(key => {
          const status = validationStatus[key];
          if (!status) return null;
          return (
            <div key={key} className={`flex items-center justify-between p-1 bg-gray-900/50 rounded`}>
              <span className="font-mono">Key ...{key.slice(-4)}</span>
              <span className={getStatusColor(status.status)}>{status.message}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-lg bg-gray-800/50 p-8 rounded-xl border border-gray-700 shadow-2xl shadow-cyan-500/10">
        <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h2a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h2m4-4h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2zM9 9a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <h1 className="text-2xl font-bold text-white mt-4">Thiết lập API Keys</h1>
            <p className="text-gray-400 mt-2">Nhập và kiểm tra API Keys của bạn từ các nhà cung cấp.</p>
        </div>

        <div className="mt-8">
            <div className="grid grid-cols-4 border-b border-gray-700">
                <TabButton provider={ApiProvider.GEMINI}>Gemini</TabButton>
                <TabButton provider={ApiProvider.AIVND_HUB}>AIVND Hub</TabButton>
                <TabButton provider={ApiProvider.OPENAI}>OpenAI</TabButton>
                <TabButton provider={ApiProvider.OPENROUTER}>OpenRouter</TabButton>
            </div>
            <div className="bg-gray-800 p-4 rounded-b-lg">
                {activeTab === ApiProvider.GEMINI && (
                    <div className="space-y-4">
                        <label htmlFor="gemini-keys" className="block text-sm font-medium text-cyan-300">Google Gemini Keys (mỗi key một dòng)</label>
                        <textarea id="gemini-keys" rows={4} value={geminiKeys} onChange={(e) => setGeminiKeys(e.target.value)} placeholder="Dán các API Key Gemini của bạn tại đây" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm" />
                        <button onClick={handleTestKeys} disabled={isTesting || !geminiKeys.trim()} className="w-full border border-cyan-500 text-cyan-400 text-sm font-bold py-2 px-4 rounded-lg hover:bg-cyan-900/50 transition duration-300 disabled:opacity-50">{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra Keys'}</button>
                        {renderValidationResults(geminiKeys.split('\n'))}
                        <p className="text-xs text-gray-500 mt-2">Lưu ý: Việc kiểm tra nhiều key Gemini sẽ có độ trễ giữa mỗi lần kiểm tra để tránh bị giới hạn tần suất API.</p>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Lấy Gemini API Key</a>
                    </div>
                )}
                 {activeTab === ApiProvider.AIVND_HUB && (
                    <div className="space-y-4">
                        <label htmlFor="aivnd-keys" className="block text-sm font-medium text-cyan-300">AIVND Hub Keys (mỗi key một dòng)</label>
                        <textarea id="aivnd-keys" rows={3} value={aivndHubKeys} onChange={(e) => setAivndHubKeys(e.target.value)} placeholder="Dán các API Key AIVND Hub của bạn" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm" />
                        
                        <label htmlFor="aivnd-endpoint" className="block text-sm font-medium text-cyan-300">API Endpoint</label>
                        <input id="aivnd-endpoint" type="text" value={aivndHubEndpoint} onChange={(e) => setAivndHubEndpoint(e.target.value)} placeholder="https://onehub.aivnd.com/v1" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm" />
                        
                        <label htmlFor="aivnd-model" className="block text-sm font-medium text-cyan-300">Chọn Model</label>
                        <select id="aivnd-model" value={aivndHubModel} onChange={(e) => setAivndHubModel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm">
                          {aivndHubModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                        </select>
                        <button onClick={handleTestKeys} disabled={isTesting || !aivndHubKeys.trim()} className="w-full border border-cyan-500 text-cyan-400 text-sm font-bold py-2 px-4 rounded-lg hover:bg-cyan-900/50 transition duration-300 disabled:opacity-50">{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra Keys'}</button>
                        {renderValidationResults(aivndHubKeys.split('\n'))}
                    </div>
                )}
                {activeTab === ApiProvider.OPENAI && (
                    <div className="space-y-4">
                        <label htmlFor="openai-keys" className="block text-sm font-medium text-cyan-300">Official OpenAI Keys (mỗi key một dòng)</label>
                        <textarea id="openai-keys" rows={4} value={openAIKeys} onChange={(e) => setOpenAIKeys(e.target.value)} placeholder="Dán các API Key OpenAI chính thức của bạn" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm" />
                        <button onClick={handleTestKeys} disabled={isTesting || !openAIKeys.trim()} className="w-full border border-cyan-500 text-cyan-400 text-sm font-bold py-2 px-4 rounded-lg hover:bg-cyan-900/50 transition duration-300 disabled:opacity-50">{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra Keys'}</button>
                        {renderValidationResults(openAIKeys.split('\n'))}
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Lấy OpenAI API Key</a>
                    </div>
                )}
                {activeTab === ApiProvider.OPENROUTER && (
                    <div className="space-y-4">
                         <label htmlFor="openrouter-keys" className="block text-sm font-medium text-cyan-300">OpenRouter Keys (mỗi key một dòng)</label>
                        <textarea id="openrouter-keys" rows={3} value={openRouterKeys} onChange={(e) => setOpenRouterKeys(e.target.value)} placeholder="Dán các API Key OpenRouter của bạn tại đây" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm" />
                         <label htmlFor="openrouter-model" className="block text-sm font-medium text-cyan-300">Chọn Model Mặc định</label>
                        <select id="openrouter-model" value={openRouterModel} onChange={(e) => setOpenRouterModel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm">
                          {openRouterModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                        </select>
                         <button onClick={handleTestKeys} disabled={isTesting || !openRouterKeys.trim()} className="w-full border border-cyan-500 text-cyan-400 text-sm font-bold py-2 px-4 rounded-lg hover:bg-cyan-900/50 transition duration-300 disabled:opacity-50">{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra Keys'}</button>
                        {renderValidationResults(openRouterKeys.split('\n'))}
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Lấy OpenRouter API Key</a>
                    </div>
                )}
            </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        <p className="text-xs text-gray-500 text-center mt-4">
            Các API key của bạn sẽ được lưu trữ an toàn trong trình duyệt của bạn và sẽ không được chia sẻ.
        </p>
        <div className="mt-6">
          <button onClick={handleSaveClick} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition duration-300">
            Lưu và Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm;