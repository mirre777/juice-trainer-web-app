export const clientsPageStyles = {
  // Main container styles
  pageContainer: "min-h-screen bg-gray-50",

  // Header styles
  headerContainer: "bg-white border-b border-gray-200 px-4 py-4",
  headerContent: "max-w-7xl mx-auto px-4",
  headerFlex: "flex items-center justify-between",
  headerTitle: "text-3xl font-bold text-gray-900",
  headerSubtitle: "text-gray-600 mt-1",
  headerControls: "flex items-center space-x-4 mt-4",

  // Search bar styles
  searchContainer: "relative w-full items-center",
  searchInput: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D2FF28] focus:border-transparent",
  searchIcon: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4",

  // Add client button styles
  addClientButton: "bg-[#D2FF28] text-black py-2 px-4 rounded-lg hover:bg-[#B8E600] transition-colors flex items-center gap-2",
  addClientIcon: "h-4 w-4",

  // Main content styles
  mainContainer: "max-w-7xl mx-auto pt-4 px-4",
  contentFlex: "flex gap-8",

  // Client list styles
  clientListContainer: "w-80 bg-[#FFFFFF] rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]",
  clientListContent: "flex flex-col h-full",
  clientListScroll: "flex-1 overflow-y-auto ph-2 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400",

  // Individual client item styles
  clientItem: "p-4 rounded-lg cursor-pointer transition-colors",
  clientItemSelected: "p-4 rounded-lg cursor-pointer transition-colors bg-[#F9FAFB] border border-gray-200 border-l-[10px] border-l-[#D2FF28]",
  clientItemHover: "p-4 rounded-lg cursor-pointer transition-colors hover:bg-[#F9FAFB]/10",
  clientItemFlex: "flex items-center space-x-3",
  clientAvatar: "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm",
  clientInfo: "flex-1 min-w-0",
  clientNameRow: "flex items-center justify-between",
  clientName: "text-sm font-medium text-gray-900 truncate",

  // Client status styles
  clientStatusActive: "px-2 py-1 text-xs font-medium rounded-full bg-[#DCFCE7] text-[#2A4D00]",
  clientStatusPending: "px-2 py-1 text-xs font-medium rounded-full bg-[#FEF9C3] text-yellow-800",
  clientStatusInactive: "px-2 py-1 text-xs font-medium rounded-full bg-transparent text-gray-800",
  clientStatusDeleted: "px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800",

  clientWorkoutInfo: "flex items-center justify-between mt-1",
  clientWorkoutText: "text-xs text-gray-500",

  // Client details styles
  detailsContainer: "flex-1",
  detailsContent: "space-y-6 bg-white border-b border-gray-200 px-8 py-6 rounded-lg shadow-sm border border-gray-200 p-6 h-[calc(100vh-200px)] overflow-y-auto",

  // Client header card styles
  clientHeaderFlex: "flex items-start justify-between",
  clientHeaderInfo: "flex items-center space-x-4",
  clientHeaderAvatar: "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl",
  clientHeaderText: "",
  clientHeaderNameRow: "flex items-center space-x-3",
  clientHeaderName: "text-2xl font-bold text-gray-900",

  // Client header status styles
  clientHeaderStatusActive: "px-3 py-1 text-sm font-medium rounded-full bg-[#D2FF28]/20 text-[#2A4D00]",
  clientHeaderStatusPending: "px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800",
  clientHeaderStatusInactive: "px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800",

  clientContactInfo: "mt-2 space-y-1",
  clientContactText: "text-gray-600",
  clientHeaderButton: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
  clientHeaderIcon: "h-5 w-5 text-gray-400",

  // Week selector styles
  weekSelectorContainer: "flex items-center justify-center",
  weekSelectorContent: "flex items-center justify-center space-x-4",
  weekSelectorButton: "p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center",
  weekSelectorButtonDisabled: "opacity-50 cursor-not-allowed hover:bg-transparent",
  weekSelectorIcon: "h-4 w-4 text-gray-600",
  weekSelectorDisplay: "text-sm font-medium text-gray-700 px-4",

  // Workout days styles
  workoutDaysContainer: "mt-6",
  workoutDaysHeader: "flex items-center space-x-2 mb-3",
  workoutDaysIcon: "h-4 w-4 text-gray-400",
  workoutDaysTitle: "text-sm font-medium text-gray-700",
  workoutDaysFlex: "flex space-x-2",
  workoutDayActive: "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-[#D2FF28] text-black",
  workoutDayInactive: "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-500",
  workoutDaySelected: "border border-gray-400",

  // Grid layout styles
  detailsGrid: "space-y-6",

  // Trainer note styles
  trainerNoteTitle: "text-lg font-semibold text-gray-900 mb-4",
  trainerNoteTextarea: "w-full h-18 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#D2FF28] focus:border-transparent bg-[#F9FAFB]",

  // Loading styles
  clientListLoading: "text-center text-gray-500 py-4",

  // No client selected styles
  noClientSelectedCard: "bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[400px]",
  noClientIconContainer: "mb-8",
  noClientIcon: "w-48 h-24",
  telescopeGroup: "",
  personGroup: "",
  starburstGroup: "",
  noClientTextContainer: "text-center",
  noClientTitle: "text-xl font-semibold text-gray-900 mb-2",
  noClientSubtitle: "text-gray-600",

  // Workout card styles
  workoutCard: "space-y-6",
  workoutCardTitle: "text-2xl font-bold text-gray-900",
  clientNoteSection: "space-y-2",
  clientNoteLabel: "text-sm font-medium text-gray-700",
  clientNoteText: "bg-[#F9FAFB] border border-gray-300 rounded-lg p-3 text-sm text-gray-600",
  exerciseListSection: "space-y-3",
  exerciseGrid: "grid grid-cols-3 gap-2",
  exerciseNotSelected: "bg-gray-100 rounded-full px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors",
  exerciseSelected: "bg-gray-100 rounded-full px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors border border-gray-400",
  exerciseNumber: "text-sm font-medium text-gray-900",
  exerciseName: "text-sm text-gray-700 flex-1 mx-2",
  setsTextComplete: "text-sm text-gray-600",
  setsTextIncomplete: "text-sm text-red-600",
  exerciseDetailSection: "space-y-4",
  exerciseDetailHeader: "flex items-center justify-between",
  exerciseDetailTitle: "text-lg font-semibold text-gray-900",
  viewHistoryLink: "text-sm text-gray-500 hover:text-[#D2FF28] underline",
  setsSection: "space-y-2",
  setsTitle: "text-sm font-medium text-gray-700",
  setsList: "space-y-1",
  setItem: "flex items-center justify-start",
  setItemNumber: "text-sm font-medium text-gray-900 w-4 text-center",
  setItemWeight: "text-sm text-gray-600 pl-4",
  performanceSection: "space-y-3",
  performanceTitle: "text-sm font-medium text-gray-700 text-center",
  performanceGraph: "space-y-2",
  performanceStats: "flex justify-between items-center",
  performanceLabel: "text-sm text-gray-600",
  performanceValue: "text-lg font-bold text-[#D2FF28]",

  // OneRM Chart styles
  oneRMChartContainer: "w-full h-48 bg-white rounded-lg",
  oneRMChartTitle: "text-sm font-medium text-gray-700 mb-2",

}