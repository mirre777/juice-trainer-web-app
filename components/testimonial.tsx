interface TestimonialProps {
  quote: string
  author: string
  role: string
  company?: string
}

export function Testimonial({ quote, author, role, company }: TestimonialProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 18V12.6C0 11.2 0.3 9.825 0.9 8.475C1.5 7.125 2.4 5.85 3.6 4.65L9 0H13.2L9.6 7.2C10.6 7.6 11.4 8.25 12 9.15C12.6 10.05 12.9 11.1 12.9 12.3C12.9 14.1 12.3 15.5 11.1 16.5C9.9 17.5 8.4 18 6.6 18H0ZM18 18V12.6C18 11.2 18.3 9.825 18.9 8.475C19.5 7.125 20.4 5.85 21.6 4.65L27 0H31.2L27.6 7.2C28.6 7.6 29.4 8.25 30 9.15C30.6 10.05 30.9 11.1 30.9 12.3C30.9 14.1 30.3 15.5 29.1 16.5C27.9 17.5 26.4 18 24.6 18H18Z"
              fill="#D2FF28"
            />
          </svg>
        </div>
        <p className="text-sm text-black flex-grow mb-4">{quote}</p>
        <div>
          <p className="text-sm font-bold text-black">{author}</p>
          <p className="text-xs text-darkgray">
            {role}
            {company ? `, ${company}` : ""}
          </p>
        </div>
      </div>
    </div>
  )
}
