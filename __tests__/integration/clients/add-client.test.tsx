"use client"

import type React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ClientsPage from "@/app/clients/page"
import { subscribeToClients } from "@/lib/firebase/client-service"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useToast } from "@/hooks/use-toast"

// Mock dependencies
jest.mock("@/lib/firebase/client-service", () => ({
  subscribeToClients: jest.fn(),
  createClient: jest.fn(),
}))

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: jest.fn(),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}))

jest.mock("@/hooks/use-error-handler", () => ({
  useErrorHandler: jest.fn(() => ({
    error: null,
    handleError: jest.fn(),
  })),
}))

// Mock components
jest.mock("@/components/shared/page-layout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>,
}))

jest.mock("@/components/clients/clients-list", () => ({
  ClientsList: ({ clients, loading }: { clients: any[]; loading: boolean }) => (
    <div data-testid="clients-list">{loading ? "Loading..." : `${clients.length} clients`}</div>
  ),
}))

jest.mock("@/components/clients/clients-filter-bar", () => ({
  ClientsFilterBar: ({ onSearch, onStatusChange }: { onSearch: any; onStatusChange: any }) => (
    <div data-testid="filter-bar">
      <button onClick={() => onSearch("test")}>Search</button>
      <button onClick={() => onStatusChange("Active")}>Filter</button>
    </div>
  ),
}))

jest.mock("@/components/clients/add-client-modal", () => ({
  AddClientModal: ({ isOpen, onClose, onClientAdded }: { isOpen: boolean; onClose: any; onClientAdded?: any }) =>
    isOpen ? (
      <div data-testid="add-client-modal">
        <button onClick={() => onClose()}>Close</button>
        <button onClick={() => onClientAdded && onClientAdded({ id: "new-client", name: "New Client" })}>
          Add Client
        </button>
      </div>
    ) : null,
}))

describe("ClientsPage Integration", () => {
  const mockUnsubscribe = jest.fn()
  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    useCurrentUser.mockReturnValue({ userId: "mock-user-id" })
    useToast.mockReturnValue({ toast: mockToast })

    // Mock the subscription to return clients
    subscribeToClients.mockImplementation((userId, callback) => {
      callback([
        { id: "client1", name: "Client 1", status: "Active" },
        { id: "client2", name: "Client 2", status: "Pending" },
      ])
      return mockUnsubscribe
    })
  })

  it("renders the clients page with clients", async () => {
    render(<ClientsPage />)

    // Check that the page layout is rendered
    expect(screen.getByTestId("page-layout")).toBeInTheDocument()

    // Check that the filter bar is rendered
    expect(screen.getByTestId("filter-bar")).toBeInTheDocument()

    // Check that the clients list is rendered with clients
    await waitFor(() => {
      expect(screen.getByTestId("clients-list")).toHaveTextContent("2 clients")
    })

    // Check that subscribeToClients was called with the user ID
    expect(subscribeToClients).toHaveBeenCalledWith("mock-user-id", expect.any(Function))
  })

  it("opens the add client modal when the add client button is clicked", async () => {
    render(<ClientsPage />)

    // Click the add client button
    fireEvent.click(screen.getByText("Add Client"))

    // Check that the add client modal is opened
    expect(screen.getByTestId("add-client-modal")).toBeInTheDocument()
  })

  it("closes the add client modal when the close button is clicked", async () => {
    render(<ClientsPage />)

    // Open the add client modal
    fireEvent.click(screen.getByText("Add Client"))

    // Check that the add client modal is opened
    expect(screen.getByTestId("add-client-modal")).toBeInTheDocument()

    // Click the close button
    fireEvent.click(screen.getByText("Close"))

    // Check that the add client modal is closed
    expect(screen.queryByTestId("add-client-modal")).not.toBeInTheDocument()
  })

  it("shows a toast notification when a client is added", async () => {
    render(<ClientsPage />)

    // Open the add client modal
    fireEvent.click(screen.getByText("Add Client"))

    // Add a client
    fireEvent.click(screen.getByText("Add Client"))

    // Check that the toast was called
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Client added",
        description: "New Client has been added to your clients.",
      }),
    )
  })

  it("filters clients when search is applied", async () => {
    render(<ClientsPage />)

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByTestId("clients-list")).toHaveTextContent("2 clients")
    })

    // Click the search button
    fireEvent.click(screen.getByText("Search"))

    // The clients list should be filtered (in this case, we're mocking it to return 0 clients)
    await waitFor(() => {
      expect(screen.getByTestId("clients-list")).toHaveTextContent("0 clients")
    })
  })

  it("filters clients when status filter is applied", async () => {
    render(<ClientsPage />)

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByTestId("clients-list")).toHaveTextContent("2 clients")
    })

    // Click the filter button
    fireEvent.click(screen.getByText("Filter"))

    // The clients list should be filtered (in this case, we're mocking it to return 1 client)
    await waitFor(() => {
      expect(screen.getByTestId("clients-list")).toHaveTextContent("1 clients")
    })
  })

  it("handles errors when loading clients", async () => {
    // Mock an error when subscribing to clients
    subscribeToClients.mockImplementation((userId, callback) => {
      callback([], new Error("Failed to load clients"))
      return mockUnsubscribe
    })

    render(<ClientsPage />)

    // Check that the toast was called with the error
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error loading clients",
        description: "There was a problem loading your clients. Please try again.",
        variant: "destructive",
      }),
    )
  })

  it("cleans up subscription when unmounting", () => {
    const { unmount } = render(<ClientsPage />)

    // Unmount the component
    unmount()

    // Check that the unsubscribe function was called
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
