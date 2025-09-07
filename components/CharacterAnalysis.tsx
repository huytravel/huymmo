import React, { useState } from 'react';

interface CharacterAnalysisProps {
  analysisResult: string | null;
  isLoading: boolean;
}

const CharacterAnalysis: React.FC<CharacterAnalysisProps> = ({ analysisResult, isLoading }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const formattedContent = (text: string) => {
    if (!text) return '';

    // Split the text into blocks for each character, starting with '###'
    const characterBlocks = text.split('### ').filter(block => block.trim() !== '');

    return characterBlocks.map(block => {
        // Each block has the name on the first line and attributes on the second
        const lines = block.trim().split('\n');
        const characterName = lines[0] || 'Không rõ tên';
        const attributesString = lines[1] || '';

        // Create the heading for the character
        const nameHtml = `<h3 class="text-lg font-semibold text-cyan-400 mt-4 mb-2">${characterName.trim()}</h3>`;

        // Parse the comma-separated attributes and create a list
        const attributesHtml = attributesString.split(',')
            .map(attr => attr.trim())
            .filter(attr => attr)
            .map(attr => {
                const parts = attr.split(/:(.*)/s); // Split only on the first colon
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts[1].trim();
                    // Using <li> for list items for better semantics and styling
                    return `<li class="ml-4"><strong class="text-gray-300">${key}:</strong> ${value}</li>`;
                }
                return ''; // Ignore malformed parts
            })
            .join('');

        return `${nameHtml}<ul class="list-disc list-inside space-y-1">${attributesHtml}</ul>`;
    }).join('');
  };


  if (!isLoading && !analysisResult) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-cyan-300">Phân Tích Nhân Vật</h3>
        {analysisResult && (
            <button
                onClick={handleCopy}
                className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-1 px-2 rounded-lg transition duration-200 disabled:opacity-50"
                disabled={isCopied}
            >
                {isCopied ? (
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
        )}
      </div>

      <div className="bg-gray-950/70 border border-gray-700 rounded-lg p-6 min-h-[150px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-6 text-cyan-300">
            <svg className="animate-spin h-8 w-8 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="mt-3">AI đang phân tích các nhân vật từ kịch bản...</span>
          </div>
        ) : analysisResult ? (
          <div
            className="prose prose-invert prose-sm text-gray-300 max-w-none"
            dangerouslySetInnerHTML={{ __html: formattedContent(analysisResult) }}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CharacterAnalysis;