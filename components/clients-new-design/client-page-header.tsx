"use client"

import { clientsPageStyles } from "../../app/clients-new-design/styles"

interface ClientPageHeaderProps {
  searchTerm: string
  onSearchChange: (term: string) => void
}

export function ClientPageHeader({ searchTerm, onSearchChange }: ClientPageHeaderProps) {

  return (
    <div className={clientsPageStyles.headerContainer}>
      <div className={clientsPageStyles.headerContent}>
        <div className={clientsPageStyles.headerFlex}>
          <div>
            <h1 className={clientsPageStyles.headerTitle}>Clients</h1>
            <p className={clientsPageStyles.headerSubtitle}>Manage your clients and track their progress</p>
          </div>
            {/* Add Client Button */}
            <button className={clientsPageStyles.addClientButton}>
              <svg className={clientsPageStyles.addClientIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Client
            </button>
          </div>

          <div className={clientsPageStyles.headerControls}>
            {/* Search Bar */}
            <div className={clientsPageStyles.searchContainer}>
              <input
                 type="text"
                 placeholder="Search by name or email..."
                 value={searchTerm}
                 onChange={(e) => onSearchChange(e.target.value)}
                 className={clientsPageStyles.searchInput}
               />
              <svg className={clientsPageStyles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
      </div>
    </div>
  )
}