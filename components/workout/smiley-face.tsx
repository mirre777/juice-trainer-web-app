export function SmileyFace() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="9" r="1.5" fill="black" />
        <circle cx="16" cy="9" r="1.5" fill="black" />
        <path
          d="M8 15C8.5 16.5 10 18 12 18C14 18 15.5 16.5 16 15"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
