import React from 'react';
import { MessageSquare } from 'lucide-react';

interface HeaderProps {
  onReferFriend: () => void;
  onMessages: () => void;
  unreadCount?: number;
}

export function Header({ onReferFriend, onMessages, unreadCount = 0 }: HeaderProps) {
  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMessages();
  };

  const handleReferClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReferFriend();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-600 z-50 shadow-lg animate-slideDown" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-md mx-auto h-[75px] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/logo kuki copy copy copy copy.png" alt="KUKI" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-bold text-white">KUKI</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMessagesClick}
            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 relative transform hover:scale-110 active:scale-95"
            title="Messages"
          >
            <MessageSquare className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse-slow">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
