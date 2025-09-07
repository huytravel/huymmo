import React, { useState, useEffect } from 'react';
import type { CharacterProfile } from '../types';

interface ScriptFormProps {
  onSubmit: (title: string, character: CharacterProfile) => void;
  onGenerateReferenceCharacter: (title: string) => void;
  isLoading: boolean;
  initialCharacter: CharacterProfile;
}

const ScriptForm: React.FC<ScriptFormProps> = ({ onSubmit, onGenerateReferenceCharacter, isLoading, initialCharacter }) => {
  const [title, setTitle] = useState('');
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter);
  const [isCharacterSectionVisible, setIsCharacterSectionVisible] = useState(false);

  useEffect(() => {
    const hasData = Object.values(initialCharacter).some(val => val && val.trim() !== '');
    if (hasData) {
      setIsCharacterSectionVisible(true);
    }
    setCharacter(initialCharacter);
  }, [initialCharacter]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, character);
  };
  
  const handleCharacterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCharacter(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
      <div className="space-y-4">
        <div>
            <label htmlFor="title" className="block text-sm font-medium text-cyan-300 mb-2">Ý tưởng câu chuyện</label>
            <textarea
              id="title"
              rows={4}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Một đầu bếp sushi trầm lặng bị mọi người coi thường lại là người duy nhất có thể nhận ra những nguyên liệu bị nguyền rủa trong một cuộc thi nấu ăn danh giá..."
              required
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
            />
        </div>

        <div>
            <button
                type="button"
                onClick={() => setIsCharacterSectionVisible(!isCharacterSectionVisible)}
                className="w-full text-left text-sm font-medium text-cyan-300 flex justify-between items-center py-2"
                aria-expanded={isCharacterSectionVisible}
            >
                <span>Mô tả nhân vật (Tùy chọn)</span>
                <svg
                    className={`h-5 w-5 transform transition-transform duration-200 ${isCharacterSectionVisible ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                    />
                </svg>
            </button>
            {isCharacterSectionVisible && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 animate-fade-in">
                    {[
                        { name: 'nationality', label: 'Quốc tịch', placeholder: 'Ví dụ: Nhật Bản' },
                        { name: 'age', label: 'Độ tuổi', placeholder: 'Ví dụ: 25' },
                        { name: 'skinColor', label: 'Màu da', placeholder: 'Ví dụ: da sáng' },
                        { name: 'hairLength', label: 'Tóc dài hay ngắn', placeholder: 'Ví dụ: tóc ngắn' },
                        { name: 'hairColor', label: 'Màu tóc', placeholder: 'Ví dụ: đen' },
                        { name: 'shirt', label: 'Áo', placeholder: 'Ví dụ: áo sơ mi trắng' },
                        { name: 'pants', label: 'Quần', placeholder: 'Ví dụ: quần tây đen' },
                    ].map(({ name, label, placeholder }) => (
                        <div key={name}>
                            <label htmlFor={name} className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                            <input
                                type="text"
                                id={name}
                                name={name}
                                value={(character as any)[name]}
                                onChange={handleCharacterChange}
                                placeholder={placeholder}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>


      <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row-reverse gap-3">
        <button 
          type="submit" 
          disabled={isLoading || !title.trim()} 
          className="w-full sm:flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Đang xử lý...' : 'Tạo dàn ý'}
        </button>
        <button 
          type="button" 
          onClick={() => onGenerateReferenceCharacter(title)}
          disabled={isLoading || !title.trim()}
          className="w-full sm:flex-1 border border-cyan-500 text-cyan-400 font-bold py-3 px-4 rounded-lg hover:bg-cyan-900/50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Đang xử lý...' : 'Gợi ý nhân vật tham khảo'}
        </button>
      </div>
    </form>
  );
};

export default ScriptForm;
