"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AddClientModal } from "@/components/clients/add-client-modal"
import { createClient } from "@/lib/firebase/client-service"
import { getCookie } from "cookies-next"
import { useToast } from "@/hooks/use-toast"

// Mock dependencies
jest.mock("@/lib/firebase/client-service", () => ({
  createClient: jest.fn(),
}))

jest.mock("cookies-next", () => ({
  getCookie: jest.fn(),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}))

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: jest.fn(() => ({ userId: "mock-user-id" })),
}))

jest.mock("@/components/clients/client-invitation-dialog", () => ({
  ClientInvitationDialog: jest.fn(({ isOpen }) =>
    isOpen ? <div data-testid="invitation-dialog">Invitation Dialog</div> : null,
  ),
}))

describe("AddClientModal", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    getCookie.mockReturnValue("mock-user-id")
    useToast.mockReturnValue({ toast: jest.fn() })
    createClient.mockResolvedValue({
      success: true,
      clientId: "mock-client-id",
      inviteCode: "mock-invite-code",
    })
  })

  it("renders correctly when open", () => {
    render(<AddClientModal isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByText("Add New Client")).toBeInTheDocument()
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Goal")).toBeInTheDocument()
    expect(screen.getByText("Select a program")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<AddClientModal isOpen={false} onClose={jest.fn()} />)

    expect(screen.queryByText("Add New Client")).not.toBeInTheDocument()
  })

  it("calls onClose when cancel button is clicked", () => {
    const onCloseMock = jest.fn()
    render(<AddClientModal isOpen={true} onClose={onCloseMock} />)

    fireEvent.click(screen.getByText("Cancel"))
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it("validates required fields", async () => {
    render(<AddClientModal isOpen={true} onClose={jest.fn()} />)

    // Submit without filling required fields
    fireEvent.click(screen.getByText("Add Client"))

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument()
    })

    // createClient should not be called
    expect(createClient).not.toHaveBeenCalled()
  })

  it("successfully adds a client", async () => {
    const onAddClientMock = jest.fn()
    const toastMock = jest.fn()
    useToast.mockReturnValue({ toast: toastMock })

    render(<AddClientModal isOpen={true} onClose={jest.fn()} onAddClient={onAddClientMock} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "john@example.com" } })
    fireEvent.change(screen.getByLabelText("Goal"), { target: { value: "Get stronger" } })

    // Submit the form
    fireEvent.click(screen.getByText("Add Client"))

    // Wait for the client to be created
    await waitFor(() => {
      expect(createClient).toHaveBeenCalledWith("mock-user-id", {
        name: "John Doe",
        email: "john@example.com",
        goal: "Get stronger",
        program: undefined,
      })
    })

    // Check that the invitation dialog is shown
    await waitFor(() => {
      expect(screen.getByTestId("invitation-dialog")).toBeInTheDocument()
    })

    // Check that onAddClient was called with the client ID
    expect(onAddClientMock).toHaveBeenCalledWith("mock-client-id")
  })

  it("handles errors when adding a client", async () => {
    const error = new Error("Failed to add client")
    createClient.mockRejectedValue(error)

    const toastMock = jest.fn()
    useToast.mockReturnValue({ toast: toastMock })

    render(<AddClientModal isOpen={true} onClose={jest.fn()} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "John Doe" } })

    // Submit the form
    fireEvent.click(screen.getByText("Add Client"))

    // Wait for the error to be handled
    await waitFor(() => {
      expect(screen.getByText("Failed to add client. Please try again.")).toBeInTheDocument()
    })

    // Check that the toast was called with the error
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error adding client",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      }),
    )
  })

  it("handles demo mode correctly", async () => {
    render(<AddClientModal isOpen={true} onClose={jest.fn()} isDemo={true} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Demo Client" } })

    // Submit the form
    fireEvent.click(screen.getByText("Add Client"))

    // In demo mode, we should show the invitation dialog without calling createClient
    await waitFor(() => {
      expect(screen.getByTestId("invitation-dialog")).toBeInTheDocument()
    })

    // createClient should not be called in demo mode
    expect(createClient).not.toHaveBeenCalled()
  })
})
