import React, { useState } from 'react';
import type { OutlineSection, ScriptPart } from '../types';
import { ApiProvider } from '../types';
import { openRouterModels, aivndHubModels, openAIModels } from './ApiKeyForm';
import CharacterAnalysis from './CharacterAnalysis';

interface ScriptDisplayProps {
  title: string;
  outline: OutlineSection[];
  scriptParts: ScriptPart[];
  onReset: () => void;
  onDownload: () => void;
  onToggleAutoGenerate: () => void;
  onRegenerateOutline: () => void;
  isGeneratingPart: boolean;
  isAutoGenerating: boolean;
  isComplete: boolean;
  delayTimer: number | null;
  scriptApiProvider: ApiProvider;
  setScriptApiProvider: (provider: ApiProvider) => void;
  scriptAivndHubModel: string;
  setScriptAivndHubModel: (model: string) => void;
  scriptOpenAIModel: string;
  setScriptOpenAIModel: (model: string) => void;
  scriptOpenRouterModel: string;
  setScriptOpenRouterModel: (model: string) => void;
  characterAnalysisResult: string | null;
  isAnalyzingCharacters: boolean;
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ 
  title, 
  outline, 
  scriptParts, 
  onReset, 
  onDownload, 
  onToggleAutoGenerate, 
  onRegenerateOutline,
  isGeneratingPart, 
  isAutoGenerating,
  isComplete,
  delayTimer,
  scriptApiProvider,
  setScriptApiProvider,
  scriptAivndHubModel,
  setScriptAivndHubModel,
  scriptOpenAIModel,
  setScriptOpenAIModel,
  scriptOpenRouterModel,
  setScriptOpenRouterModel,
  characterAnalysisResult,
  isAnalyzingCharacters,
}) => {
  const [isOutlineCopied, setIsOutlineCopied] = useState(false);
  const [isTitleCopied, setIsTitleCopied] = useState(false);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [copiedPartIndex, setCopiedPartIndex] = useState<number | null>(null);
  
  const handleCopyOutline = () => {
    const formattedOutline = outline.map((section, index) => (
      `Phần ${index + 1}: ${section.title}\n` +
      `Mục tiêu: ${section.wordTarget} / ${section.paragraphTarget}\n` +
      `Mô tả: ${section.description}`
    )).join('\n\n---\n\n');

    navigator.clipboard.writeText(formattedOutline).then(() => {
      setIsOutlineCopied(true);
      setTimeout(() => setIsOutlineCopied(false), 2000);
    });
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(title).then(() => {
      setIsTitleCopied(true);
      setTimeout(() => setIsTitleCopied(false), 2000);
    });
  };

  const handleCopyAll = () => {
    const fullScript = scriptParts.map(part => part.content).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullScript).then(() => {
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2000);
    });
  };
  
  const handleCopyPart = (content: string, index: number) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedPartIndex(index);
      setTimeout(() => setCopiedPartIndex(null), 2000);
    });
  };

  const renderActionButton = () => {
    if (isAutoGenerating) {
      if (delayTimer !== null && delayTimer > 0) {
        return (
          <button 
            onClick={onToggleAutoGenerate} 
            className="w-full sm:w-auto flex-grow bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:from-gray-700 hover:to-gray-800 transition duration-300 flex items-center justify-center gap-2"
            title="Nhấp để dừng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tạo phần tiếp theo sau {delayTimer}s...
          </button>
        );
      }

      return (
        <button 
          onClick={onToggleAutoGenerate} 
          className="w-full sm:w-auto flex-grow bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:from-red-600 hover:to-orange-700 transition duration-300"
        >
          {isGeneratingPart 
            ? `Đang tạo Phần ${scriptParts.length + 1}...` 
            : 'Dừng tạo tự động'}
        </button>
      );
    }

    if (isComplete) {
      return <p className="flex-grow text-center font-semibold text-green-400">Kịch bản đã hoàn thành!</p>;
    }

    return (
       <button 
        onClick={onToggleAutoGenerate} 
        disabled={isGeneratingPart}
        className="w-full sm:w-auto flex-grow bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {scriptParts.length > 0
          ? `Tiếp tục tạo tự động (${scriptParts.length} / ${outline.length})`
          : `Bắt đầu tạo tự động (0 / ${outline.length})`
        }
      </button>
    );
  };

  return (
    <div className="mt-10 animate-fade-in space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">{title}</h2>
          <button
            onClick={handleCopyTitle}
            className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-1 px-2 rounded-lg transition duration-200 disabled:opacity-50"
            disabled={isTitleCopied}
          >
            {isTitleCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Đã sao chép!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Sao chép
              </>
            )}
          </button>
        </div>
        <p className="text-gray-400 mt-1">Không gian làm việc tạo kịch bản của bạn.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="w-full flex-grow flex flex-col sm:flex-row items-center gap-2">
            {renderActionButton()}
             {!isComplete && (
                <div className="w-full sm:w-auto flex items-center gap-2">
                    <select
                        id="script-provider-select"
                        value={scriptApiProvider}
                        onChange={(e) => setScriptApiProvider(e.target.value as ApiProvider)}
                        disabled={isAutoGenerating || isGeneratingPart}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="Chọn nhà cung cấp AI cho kịch bản"
                    >
                        <option value={ApiProvider.GEMINI}>Gemini</option>
                        <option value={ApiProvider.AIVND_HUB}>AIVND Hub</option>
                        <option value={ApiProvider.OPENAI}>OpenAI</option>
                        <option value={ApiProvider.OPENROUTER}>OpenRouter</option>
                    </select>
                    
                    {scriptApiProvider === ApiProvider.AIVND_HUB && (
                        <select
                            id="script-aivnd-model-select"
                            value={scriptAivndHubModel}
                            onChange={(e) => setScriptAivndHubModel(e.target.value)}
                            disabled={isAutoGenerating || isGeneratingPart}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            aria-label="Chọn Model AIVND Hub cho kịch bản"
                        >
                           {aivndHubModels.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                    )}
                    {scriptApiProvider === ApiProvider.OPENAI && (
                        <select
                            id="script-openai-model-select"
                            value={scriptOpenAIModel}
                            onChange={(e) => setScriptOpenAIModel(e.target.value)}
                            disabled={isAutoGenerating || isGeneratingPart}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            aria-label="Chọn Model OpenAI cho kịch bản"
                        >
                           {openAIModels.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                    )}
                    {scriptApiProvider === ApiProvider.OPENROUTER && (
                        <select
                            id="script-openrouter-model-select"
                            value={scriptOpenRouterModel}
                            onChange={(e) => setScriptOpenRouterModel(e.target.value)}
                            disabled={isAutoGenerating || isGeneratingPart}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            aria-label="Chọn Model OpenRouter cho kịch bản"
                        >
                           {openRouterModels.map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                    )}
                </div>
              )}
          </div>
          <div className="flex items-center gap-2">
              <button onClick={handleCopyAll} disabled={scriptParts.length === 0 || isAllCopied} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isAllCopied ? 'Đã sao chép!' : 'Sao chép toàn bộ'}
              </button>
              <button onClick={onDownload} disabled={scriptParts.length === 0} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Tải kịch bản
              </button>
              {scriptParts.length > 0 && !isComplete && (
                <button
                    onClick={onRegenerateOutline}
                    disabled={isAutoGenerating || isGeneratingPart}
                    className="font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm border border-yellow-500 text-yellow-400 hover:bg-yellow-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Tạo một dàn ý mới với cùng chủ đề"
                >
                    Tạo lại dàn ý
                </button>
              )}
              <button 
                onClick={onReset} 
                disabled={isAutoGenerating || isGeneratingPart}
                className={`font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isComplete 
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
                    : 'border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50'
                }`}
              >
                {isComplete ? 'Tạo Kịch Bản Mới' : 'Tạo Mới'}
              </button>
          </div>
      </div>
      
      {/* Outline and Script Parts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Outline Panel */}
        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-3 sticky top-[70px] bg-gray-900 py-2 z-[5]">
            <h3 className="text-xl font-semibold text-cyan-300">Dàn Ý Kịch Bản</h3>
            <button
                onClick={handleCopyOutline}
                className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-1 px-2 rounded-lg transition duration-200 disabled:opacity-50"
                disabled={isOutlineCopied}
            >
                {isOutlineCopied ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Đã sao chép!
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Sao chép
                    </>
                )}
            </button>
          </div>
          <div className="space-y-3">
            {outline.map((section, index) => (
              <div key={index} className={`p-3 rounded-lg border transition-all duration-300 ${scriptParts.length > index ? 'border-green-500 bg-green-900/30' : scriptParts.length === index ? 'border-cyan-500 bg-cyan-900/30 animate-pulse-border' : 'border-gray-700 bg-gray-800/50'}`}>
                <h4 className="font-bold text-white">Phần {index + 1}: {section.title}</h4>
                <p className="text-xs text-gray-400">{section.wordTarget} / {section.paragraphTarget}</p>
                <p className="mt-1 text-sm text-gray-300">{section.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Script Panel */}
        <div className="md:col-span-2 space-y-8">
           <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-3">Kịch Bản Đã Tạo</h3>
              {scriptParts.length > 0 ? (
                  <div className="bg-gray-950/70 border border-gray-700 rounded-lg p-6 max-h-[80vh] overflow-y-auto space-y-4">
                    {scriptParts.map((part, index) => (
                        <div key={index} className="animate-fade-in group relative">
                            <button
                              onClick={() => handleCopyPart(part.content, index)}
                              className="absolute top-2 right-2 z-10 flex items-center text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 text-cyan-300 font-semibold py-1 px-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-100"
                              disabled={copiedPartIndex === index}
                              aria-label="Sao chép phần kịch bản"
                            >
                              {copiedPartIndex === index ? (
                                  <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      Đã sao chép!
                                  </>
                              ) : (
                                  <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                      Sao chép
                                  </>
                              )}
                            </button>
                            <pre className="whitespace-pre-wrap font-mono text-gray-300 text-sm">
                                {part.content}
                            </pre>
                            {index < scriptParts.length -1 && <hr className="border-gray-700 my-6"/>}
                        </div>
                    ))}
                    {isGeneratingPart && (
                        <div className="flex items-center justify-center p-4 text-cyan-300">
                          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <span>Đang viết...</span>
                        </div>
                      )}
                  </div>
              ) : (
                <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg p-10 text-center text-gray-500">
                  <p>Các phần kịch bản được tạo sẽ xuất hiện ở đây.</p>
                  <p>Nhấp vào "Bắt đầu tạo tự động" để bắt đầu.</p>
                </div>
              )}
           </div>
           
           {isComplete && (
                <CharacterAnalysis
                    analysisResult={characterAnalysisResult}
                    isLoading={isAnalyzingCharacters}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default ScriptDisplay;
