"use client"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  className?: string
}

const EMOJI_OPTIONS = [
  "👍",
  "👎",
  "❤️",
  "🔥",
  "💪",
  "👏",
  "🎉",
  "😍",
  "😊",
  "😎",
  "💯",
  "⭐",
  "✨",
  "🚀",
  "💥",
  "🏆",
  "🥇",
  "💎",
  "⚡",
  "🌟",
]

export default function EmojiPicker({ onSelect, onClose, className = "" }: EmojiPickerProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border p-3 ${className}`}>
      <div className="grid grid-cols-5 gap-2 max-w-[200px]">
        {EMOJI_OPTIONS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t">
        <button onClick={onClose} className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}
