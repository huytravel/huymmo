import React from 'react';

const loadingMessages = [
  "Sáng tạo nhân vật chính...",
  "Xây dựng một thế giới hấp dẫn...",
  "Tạo ra một cốt truyện kịch tính...",
  "Lên kế hoạch cho những bất ngờ...",
  "Xây dựng dàn ý câu chuyện...",
];

const Loader: React.FC = () => {
    const [message, setMessage] = React.useState(loadingMessages[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-10 flex flex-col items-center justify-center text-center p-6">
            <svg className="animate-pulse h-16 w-16 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-lg font-semibold text-cyan-300 transition-opacity duration-500">{message}</p>
            <p className="text-gray-500 text-sm">AI đang chuẩn bị nền tảng cho câu chuyện của bạn. Vui lòng đợi.</p>
        </div>
    );
};

export default Loader;