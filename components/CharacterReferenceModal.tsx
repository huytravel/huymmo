import React, { useState, useEffect } from 'react';

interface CharacterReferenceModalProps {
  description: string | null;
  isLoading: boolean;
  onClose: () => void;
  language: string;
}

const CharacterReferenceModal: React.FC<CharacterReferenceModalProps> = ({ description, isLoading, onClose, language }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [modalTitle, setModalTitle] = useState('Gợi ý nhân vật tham khảo');
  const [copyButtonText, setCopyButtonText] = useState('Sao chép');
  const [copiedButtonText, setCopiedButtonText] = useState('Đã sao chép!');

  useEffect(() => {
    // A simple translation map for the UI elements
    const translations: { [key: string]: any } = {
        English: { title: 'Character Reference Suggestion', copy: 'Copy', copied: 'Copied!' },
        Vietnamese: { title: 'Gợi ý nhân vật tham khảo', copy: 'Sao chép', copied: 'Đã sao chép!' },
        Japanese: { title: 'キャラクター参考案', copy: 'コピー', copied: 'コピーしました！' },
        // Add other languages as needed
    };
    const lang = translations[language] || translations['Vietnamese'];
    setModalTitle(lang.title);
    setCopyButtonText(lang.copy);
    setCopiedButtonText(lang.copied);
  }, [language]);


  useEffect(() => {
    if (!isLoading && !description) {
      return;
    }
    // Handle Escape key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isLoading, description]);

  const handleCopy = () => {
    if (description) {
      navigator.clipboard.writeText(description).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  if (!isLoading && !description) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-modal-title"
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-cyan-500/10 w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="character-modal-title" className="text-lg font-semibold text-cyan-300">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-10">
              <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="mt-4 text-cyan-300">AI đang sáng tạo nhân vật...</p>
              <p className="text-sm text-gray-500">Quá trình này có thể mất vài giây.</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm leading-relaxed">
              {description}
            </pre>
          )}
        </div>

        <footer className="p-4 border-t border-gray-700 mt-auto">
          <button
            onClick={handleCopy}
            disabled={!description || isCopied}
            className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {copiedButtonText}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {copyButtonText}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CharacterReferenceModal;
