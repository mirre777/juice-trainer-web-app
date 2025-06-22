"use client"

import { UnifiedHeader } from "@/components/unified-header"

export default function SessionsPage() {
  // This page already has mock data
  return (
    <div className="bg-white">
      <UnifiedHeader />

      {/* Main Content */}
      <main className="px-24 py-8">
        {/* Header with title and new session button */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">Sessions Calendar</h2>

          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-lime-300 rounded-lg flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-black font-medium">New Session</span>
            </button>

            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="text-base font-medium">April 2025</span>
              <button className="w-8 h-8 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center mb-8">
          <div className="flex gap-4">
            <div className="relative">
              <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm">All Clients</span>
                <svg
                  className="ml-8"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm">All Session Types</span>
                <svg
                  className="ml-8"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M16 2V6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 2V6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 10H21" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm">Date Range</span>
                <svg
                  className="ml-8"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex">
            <button className="px-3 py-1 bg-lime-300 rounded-l-lg text-sm">Calendar</button>
            <button className="px-3 py-1 border border-gray-200 rounded-r-lg text-sm">List</button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-gray-500 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Week 1 */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {/* Previous month days */}
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-gray-400 text-xs mb-1">30</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-gray-400 text-xs mb-1">31</div>
            </div>

            {/* Current month days */}
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">1</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">2</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">3</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">4</div>
            </div>
            <div className="min-h-24 p-2 border-b border-gray-100">
              <div className="text-xs mb-1">5</div>
            </div>
          </div>

          {/* Calendar Grid - Week 2 */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">6</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">7</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Ryan W. - Training (9:00 AM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">8</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">9</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-orange-500 before:rounded-full">
                  Michael K. - Consult (2:30 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">10</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">11</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Karen L. - Training (4:00 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-b border-gray-100">
              <div className="text-xs mb-1">12</div>
            </div>
          </div>

          {/* Calendar Grid - Week 3 */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">13</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">14</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-blue-400 before:rounded-full">
                  Anna S. - Assessment (10:00 AM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">15</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Marcus R. - Training (3:30 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">16</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">17</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Alicia J. - Training (9:30 AM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">18</div>
            </div>
            <div className="min-h-24 p-2 border-b border-gray-100">
              <div className="text-xs mb-1">19</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-orange-500 before:rounded-full">
                  Ryan W. - Consult (11:00 AM)
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Grid - Week 4 (with current day) */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">20</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Michael K. - Training (1:00 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 bg-lime-300/10 border-r border-b border-gray-100">
              <div className="text-xs font-semibold mb-1">21</div>
              <div className="pl-3 relative text-xs font-semibold mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Ryan W. - Training (11:00 AM)
                </span>
              </div>
              <div className="pl-3 relative text-xs font-semibold mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-blue-400 before:rounded-full">
                  Alicia J. - Assessment (2:30 PM)
                </span>
              </div>
              <div className="pl-3 relative text-xs font-semibold mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-orange-500 before:rounded-full">
                  Michael K. - Consult (5:00 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">22</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Karen L. - Training (8:00 AM)
                </span>
              </div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Marcus R. - Training (4:30 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">23</div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">24</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-blue-400 before:rounded-full">
                  Ryan W. - Assessment (10:00 AM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-b border-gray-100">
              <div className="text-xs mb-1">25</div>
            </div>
            <div className="min-h-24 p-2 border-b border-gray-100">
              <div className="text-xs mb-1">26</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Anna S. - Training (3:00 PM)
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Grid - Week 5 */}
          <div className="grid grid-cols-7">
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-xs mb-1">27</div>
            </div>
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-xs mb-1">28</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-lime-300 before:rounded-full">
                  Alicia J. - Training (11:30 AM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-xs mb-1">29</div>
            </div>
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-xs mb-1">30</div>
              <div className="pl-3 relative text-xs mb-0.5">
                <span className="before:content-[''] before:absolute before:left-0 before:top-[5px] before:w-2 before:h-2 before:bg-orange-500 before:rounded-full">
                  Karen L. - Consult (4:00 PM)
                </span>
              </div>
            </div>
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-gray-400 text-xs mb-1">1</div>
            </div>
            <div className="min-h-24 p-2 border-r border-gray-100">
              <div className="text-gray-400 text-xs mb-1">2</div>
            </div>
            <div className="min-h-24 p-2">
              <div className="text-gray-400 text-xs mb-1">3</div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Monthly Sessions Chart */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Monthly Sessions</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 12H7L10 20L14 4L17 12H21"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="h-64 flex items-center justify-center">
              <img
                src="https://placehold.co/350x256"
                alt="Monthly Sessions Chart"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Session Types Chart */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Session Types</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="h-64 flex items-center justify-center">
              <img
                src="https://placehold.co/350x256"
                alt="Session Types Chart"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Client Engagement */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Client Engagement</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Client Engagement Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Ryan Wilson</span>
                  <span className="text-sm font-medium">96%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-lime-300 rounded-full w-[96%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Alicia Johnson</span>
                  <span className="text-sm font-medium">92%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-lime-300 rounded-full w-[92%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Michael Keaton</span>
                  <span className="text-sm font-medium">88%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-lime-300 rounded-full w-[88%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Karen Lewis</span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-lime-300 rounded-full w-[78%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
