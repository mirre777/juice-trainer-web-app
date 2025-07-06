"use client"

import React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  User,
  Settings,
  CheckSquare,
  Square,
  Plus,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar,
  LogOut,
} from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { db } from "@/lib/firebase/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { getCookie } from "cookies-next"
import { LogoutModal } from "@/components/auth/logout-modal"

// Memoize the LogoutButton to prevent re-renders
const MemoizedLogoutButton = React.memo(LogoutButton)

// Create a global variable to cache the username
let cachedUserName: string | null = null

// Memoize the main header component
export const UnifiedHeader = React.memo(function UnifiedHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showTaskList, setShowTaskList] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const savedTaskListState = localStorage.getItem("taskListOpen")
      return savedTaskListState ? JSON.parse(savedTaskListState) : false
    }
    return false
  })
  const [darkMode, setDarkMode] = useState(false)
  const [tasks, setTasks] = useState(() => {
    // Initialize tasks from localStorage if available
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("tasks")
      return savedTasks
        ? JSON.parse(savedTasks)
        : [
            { id: 1, text: "Complete client assessment", completed: false },
            { id: 2, text: "Send invoice to new clients", completed: true },
            { id: 3, text: "Prepare workout plan", completed: false },
          ]
    }
    return [
      { id: 1, text: "Complete client assessment", completed: false },
      { id: 2, text: "Send invoice to new clients", completed: true },
      { id: 3, text: "Prepare workout plan", completed: false },
    ]
  })
  const [newTask, setNewTask] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  // Try to load username from localStorage first, but don't rely on it exclusively
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const savedUserName = localStorage.getItem("userName")
      if (savedUserName && savedUserName.trim()) {
        return savedUserName
      }
    }
    return "" // Only return empty if no cached value exists
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const taskListRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Memoize demo mode check
  const isDemoMode = useMemo(() => pathname?.startsWith("/demo"), [pathname])
  const pathPrefix = useMemo(() => (isDemoMode ? "/demo" : ""), [isDemoMode])

  // Fetch user data directly from Firestore if not in demo mode
  useEffect(() => {
    if (!isDemoMode) {
      const fetchUserData = async () => {
        try {
          // Get user ID from cookie
          const userId = getCookie("user_id")

          if (!userId) {
            console.log("No user_id cookie found")
            return
          }

          console.log("Fetching user data for ID:", userId)

          // Set up a real-time listener for the user document
          const userDocRef = doc(db, "users", userId as string)
          const unsubscribe = onSnapshot(
            userDocRef,
            { includeMetadataChanges: true },
            (userDoc) => {
              if (!userDoc.exists()) {
                console.log("No user document found for ID:", userId)
                return
              }

              const userData = userDoc.data()
              console.log("User data fetched:", userData)

              let name = ""
              if (userData && userData.name) {
                name = userData.name
                console.log("Using name from user data:", name)
              } else if (userData && userData.firstName && userData.lastName) {
                name = `${userData.firstName} ${userData.lastName}`
                console.log("Using firstName + lastName:", name)
              } else if (userData && userData.email) {
                // Use email as fallback if name is not available
                name = userData.email.split("@")[0]
                console.log("Using email-based name:", name)
              }

              // Update the cached username
              cachedUserName = name
              setUserName(name)

              // Save to localStorage for faster loading next time
              if (typeof window !== "undefined") {
                localStorage.setItem("userName", name)
              }
            },
            (error) => {
              console.error("Error fetching user data from Firestore:", error)
            },
          )

          // Clean up the listener when the component unmounts
          return () => {
            console.log("Cleaning up Firestore listener")
            unsubscribe()
          }
        } catch (error) {
          console.error("Error setting up Firestore listener:", error)
        }
      }

      fetchUserData()
    }
  }, [isDemoMode])

  // Memoize display name
  const displayName = useMemo(() => {
    return isDemoMode ? "Jackie SuperJacked" : userName && userName.trim() ? userName : "Loading..."
  }, [isDemoMode, userName])

  // Memoize isActive function
  const isActive = useCallback(
    (path: string) => {
      // Remove trailing slashes for consistency
      const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path
      const normalizedPathname = pathname?.endsWith("/") ? pathname.slice(0, -1) : pathname

      // Handle demo paths
      const basePath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`
      const demoPath = `/demo${basePath}`

      // Special case for overview pages
      if (normalizedPath === "/overview") {
        if (isDemoMode) {
          return normalizedPathname === "/demo" || normalizedPathname === "/demo/overview"
        } else {
          return normalizedPathname === "/" || normalizedPathname === "/overview"
        }
      }

      // Special case for programs/import-programs
      if (normalizedPath === "/import-programs") {
        if (isDemoMode) {
          return normalizedPathname === "/demo/import-programs" || normalizedPathname === "/demo/programs"
        } else {
          return normalizedPathname === "/import-programs" || normalizedPathname === "/programs"
        }
      }

      // Regular path matching
      if (isDemoMode) {
        return normalizedPathname === demoPath || normalizedPathname?.startsWith(`${demoPath}/`)
      } else {
        return normalizedPathname === basePath || normalizedPathname?.startsWith(`${basePath}/`)
      }
    },
    [pathname, isDemoMode],
  )

  // Memoize navigation items - ONLY CHANGE: Removed Finance
  const navItems = useMemo(
    () => [
      { name: "Overview", path: "/overview" },
      { name: "Clients", path: "/clients" },
      { name: "Calendar", path: "/calendar" },
      { name: "Programs", path: "/import-programs" },
      // { name: "Finance", path: "/finance" }, // Hidden but still accessible via URL
      { name: "Marketplace", path: "https://www.juice.fitness/marketplace" },
    ],
    [],
  )

  // Memoize current index
  const currentIndex = useMemo(
    () => navItems.findIndex((item) => !item.external && isActive(item.path)),
    [navItems, isActive],
  )

  // Memoize task completion stats
  const taskStats = useMemo(
    () => ({
      completed: tasks.filter((t) => t.completed).length,
      total: tasks.length,
    }),
    [tasks],
  )

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("taskListOpen", JSON.stringify(showTaskList))
  }, [showTaskList])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode)
  }, [darkMode])

  // First, add a function to play the sound when a task is completed
  const playTaskCompleteSound = useCallback(() => {
    const audio = new Audio("/sounds/task-complete.wav")
    audio.volume = 0.5

    // This ensures the sound plays even if the user hasn't interacted with the page
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }, [])

  // Then update the toggleTaskCompletion function to play the sound when a task is marked as completed
  const toggleTaskCompletion = useCallback(
    (id: number) => {
      const task = tasks.find((t) => t.id === id)
      const wasCompleted = task?.completed

      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))

      // Play sound only when marking as completed, not when unchecking
      if (!wasCompleted) {
        playTaskCompleteSound()
      }
    },
    [tasks, playTaskCompleteSound],
  )

  const addTask = useCallback(() => {
    if (newTask.trim()) {
      const newId = Math.max(0, ...tasks.map((t) => t.id)) + 1
      setTasks([...tasks, { id: newId, text: newTask.trim(), completed: false }])
      setNewTask("")
    }
  }, [newTask, tasks])

  const removeTask = useCallback(
    (id: number) => {
      setTasks(tasks.filter((task) => task.id !== id))
    },
    [tasks],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        addTask()
      }
    },
    [addTask],
  )

  const navigateTo = useCallback(
    (direction: "prev" | "next") => {
      if (currentIndex === -1) return

      let newIndex = currentIndex
      if (direction === "prev") {
        newIndex = Math.max(0, currentIndex - 1)
      } else {
        newIndex = Math.min(navItems.length - 1, currentIndex + 1)
      }

      if (newIndex !== currentIndex) {
        router.push(`${pathPrefix}${navItems[newIndex].path}`)
      }
    },
    [currentIndex, navItems, pathPrefix, router],
  )

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return (
    <>
      {/* Header */}
      <div className="relative z-30 bg-white">
        <div className="px-4 sm:px-6 md:px-8 lg:px-20">
          <div className="max-w-[1280px] py-4 mx-auto">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="text-2xl md:text-3xl font-bold text-black">Juice</div>

              {/* Navigation - Desktop */}
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.path.startsWith("http") ? (
                      <a
                        href={item.path}
                        className="py-3 whitespace-nowrap text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        href={`${pathPrefix}${item.path}`}
                        className={`py-3 whitespace-nowrap cursor-pointer text-sm ${
                          isActive(item.path)
                            ? "border-b-2 border-lime-300 font-medium"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Right section with user name, upgrade button and action icons */}
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-sm font-medium text-black min-w-[80px] text-right">
                  {displayName}
                </div>
                <Link
                  href="/pricing"
                  className="hidden md:block bg-gradient-to-r from-[#d2ff28] to-[#a8cc20] text-black px-4 py-2 rounded-full text-sm font-medium hover:from-[#c2ef18] hover:to-[#98bc10] transition-colors"
                >
                  Upgrade
                </Link>

                {/* Task List icon */}
                <div className="relative hidden md:block" ref={taskListRef}>
                  <div
                    className="w-11 h-11 relative overflow-hidden cursor-pointer hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                    onClick={() => {
                      setShowTaskList(!showTaskList)
                    }}
                  >
                    <CheckSquare className="h-6 w-6" />
                  </div>

                  {/* Task List Dropdown */}
                  {showTaskList && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">Tasks</h3>
                          <div className="text-xs text-gray-500">
                            {taskStats.completed}/{taskStats.total} completed
                          </div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                          {tasks.map((task) => (
                            <div key={task.id} className="flex items-center group">
                              <button onClick={() => toggleTaskCompletion(task.id)} className="flex-shrink-0 mr-2">
                                {task.completed ? (
                                  <CheckSquare className="h-5 w-5 text-lime-500" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm ${task.completed ? "line-through text-gray-400" : ""}`}>
                                {task.text}
                              </span>
                              <button
                                onClick={() => removeTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          ))}

                          {tasks.length === 0 && (
                            <div className="text-center text-sm text-gray-500 py-2">No tasks yet. Add one below!</div>
                          )}
                        </div>

                        <div className="flex items-center">
                          <input
                            type="text"
                            placeholder="Add a new task..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-lime-300 text-sm"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                          <button
                            onClick={addTask}
                            className="px-3 py-2 bg-lime-300 rounded-r-md hover:bg-lime-400 transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings dropdown */}
                <Link
                  href={`${pathPrefix}/settings`}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Settings"
                >
                  <Settings className="h-6 w-6" />
                </Link>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2 rounded-md hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation - Mobile */}
            <div className="md:hidden relative flex items-center justify-between mt-4">
              {/* Left Arrow */}
              <button
                onClick={() => navigateTo("prev")}
                className={`p-2 rounded-full ${currentIndex > 0 ? "text-gray-700" : "text-gray-300"}`}
                disabled={currentIndex <= 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Current Page Title */}
              <div className="text-center font-medium text-sm">
                {currentIndex >= 0 ? navItems[currentIndex].name : "Menu"}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => navigateTo("next")}
                className={`p-2 rounded-full ${currentIndex < navItems.length - 1 ? "text-gray-700" : "text-gray-300"}`}
                disabled={currentIndex >= navItems.length - 1}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Demo banner for mobile */}
            {pathname?.startsWith("/demo") && (
              <div className="md:hidden flex flex-col items-center mt-4 bg-lime-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium mb-2">🚀 You're exploring the demo version</span>
                <Link
                  href="/signup"
                  className="bg-black text-white px-3 py-1 rounded-md text-sm font-medium w-full text-center"
                >
                  Start Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div ref={mobileMenuRef} className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <div className="text-2xl font-bold text-black">Juice</div>
              <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setShowMobileMenu(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex justify-center items-center">
                <div className="text-base font-medium text-violet-600">
                  {isDemoMode ? "JS" : userName ? userName.charAt(0) : "G"}
                </div>
              </div>
              <div>
                <div className="text-base font-medium text-black">
                  {isDemoMode ? "Jackie SuperJacked" : userName || "Loading..."}
                </div>
                <div className="text-sm text-gray-500">Premium Plan</div>
              </div>
            </div>

            <nav className="space-y-1">
              <Link
                href={`${pathPrefix}/overview`}
                className={`flex items-center px-4 py-3 rounded-md text-sm ${isActive("/overview") ? "bg-lime-300 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
                </svg>
                Overview
              </Link>
              <Link
                href={`${pathPrefix}/clients`}
                className={`flex items-center px-4 py-3 rounded-md text-sm ${isActive("/clients") ? "bg-lime-300 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="w-5 h-5 mr-3" />
                Clients
              </Link>
              <Link
                href={`${pathPrefix}/calendar`}
                className={`flex items-center px-4 py-3 rounded-md text-sm ${isActive("/calendar") ? "bg-lime-300 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Calendar className="w-5 h-5 mr-3" />
                Calendar
              </Link>
              <Link
                href={`${pathPrefix}/import-programs`}
                className={`flex items-center px-4 py-3 rounded-md text-sm ${isActive("/import-programs") ? "bg-lime-300 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Programs
              </Link>
              <a
                href="https://www.juice.fitness/marketplace"
                className="flex items-center px-4 py-3 rounded-md text-sm text-gray-600 hover:bg-gray-50"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMobileMenu(false)}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 22V12H15V22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Marketplace
              </a>
              <Link
                href={`${pathPrefix}/settings`}
                className={`flex items-center px-4 py-3 rounded-md text-sm ${isActive("/settings") ? "bg-lime-300 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Link>
            </nav>

            <div className="mt-8 pt-4 border-t border-gray-200">
              {!pathname?.startsWith("/demo") && (
                <Link
                  href="/pricing"
                  className="flex justify-center items-center w-full mb-4 bg-gradient-to-r from-[#d2ff28] to-[#a8cc20] text-black px-4 py-3 rounded-md text-sm font-medium hover:from-[#c2ef18] hover:to-[#98bc10] transition-colors"
                >
                  Upgrade Your Plan
                </Link>
              )}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full justify-center flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <LogoutModal open={showLogoutModal} onOpenChange={setShowLogoutModal} />
    </>
  )
})
