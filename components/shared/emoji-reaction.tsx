"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"

interface EmojiReactionProps {
  onEmojiSelect: (emoji: string) => void
  showComment?: boolean
  className?: string
}

export function EmojiReaction({ onEmojiSelect, showComment = true, className = "" }: EmojiReactionProps) {
  const [showEmojis, setShowEmojis] = useState(false)
  const emojis = ["💪", "🔥", "👏", "⭐", "🚀", "✨"]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowEmojis(!showEmojis)}
        className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow hover:shadow-md transform hover:-translate-y-0.5"
      >
        <span className="text-lg">👍</span>
      </button>

      {showComment && (
        <button className="ml-2 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-all shadow hover:shadow-md transform hover:-translate-y-0.5">
          <MessageSquare className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {showEmojis && (
        <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg p-2 flex space-x-2 z-10">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onEmojiSelect(emoji)
                setShowEmojis(false)
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
