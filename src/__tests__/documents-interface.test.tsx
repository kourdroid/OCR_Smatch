import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { DocumentsInterface } from '@/components/documents-interface'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock auth store
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    profile: { id: 'test-user', email: 'test@example.com' },
    organization: { id: 'test-org', company_name: 'Test Org' },
    isAdmin: false,
    fetchProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

// Mock language context
vi.mock('@/contexts/language-context', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }),
  },
  isSupabaseAvailable: () => true,
}))

// Mock RealTime hook
vi.mock('@/hooks/use-real-time', () => ({
  useRealTime: () => ({
    isConnected: true,
    lastUpdate: new Date(),
    newDocumentCount: 0,
  }),
}))

// Mock Document Schema Service
vi.mock('@/lib/document-schema', () => ({
  documentSchemaService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllDocumentTypes: vi.fn().mockReturnValue([]),
    getInitializationStatus: vi.fn().mockReturnValue({ error: null }),
  },
}))

// Mock Child Components to simplify testing and focus on DocumentsInterface logic
vi.mock('@/components/documents-table', () => ({
  DocumentsTable: ({ documentRows }: { documentRows: any[] }) => (
    <div data-testid="documents-table">
      {documentRows.map((row, index) => (
        <div key={index} data-testid={`row-${row.type}`}>
          {row.type === 'group'
            ? `Group: ${row.group.groupKey} (${row.group.documents.length})`
            : `Single: ${row.document.supplier}`}
        </div>
      ))}
    </div>
  ),
}))

// Mock UI components that might cause issues
vi.mock('@/components/ui/sidebar', () => {
  const FakeSidebar = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  return {
    Sidebar: FakeSidebar,
    SidebarContent: FakeSidebar,
    SidebarFooter: FakeSidebar,
    SidebarGroup: FakeSidebar,
    SidebarGroupContent: FakeSidebar,
    SidebarGroupLabel: FakeSidebar,
    SidebarHeader: FakeSidebar,
    SidebarInset: FakeSidebar,
    SidebarMenu: FakeSidebar,
    SidebarMenuButton: FakeSidebar,
    SidebarMenuItem: FakeSidebar,
    SidebarMenuSub: FakeSidebar,
    SidebarMenuSubItem: FakeSidebar,
    SidebarMenuSubButton: FakeSidebar,
    SidebarProvider: FakeSidebar,
    SidebarTrigger: () => <button>Trigger</button>,
    SidebarRail: () => <div />,
  }
})

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('DocumentsInterface', () => {
  const mockDocuments: any[] = [
    {
      id: '1',
      supplier: 'Supplier A',
      type: 'Invoice',
      amount: 100,
      confidence: 0.9,
      receivedAt: new Date(),
      status: 'extracted',
    },
    {
      id: '2',
      supplier: 'Supplier A',
      type: 'Invoice',
      amount: 200,
      confidence: 0.95,
      receivedAt: new Date(),
      status: 'extracted',
    },
    {
      id: '3',
      supplier: 'Supplier B',
      type: 'Invoice',
      amount: 150,
      confidence: 0.8,
      receivedAt: new Date(),
      status: 'needs review',
    },
  ];

  it('renders correctly', async () => {
    render(<DocumentsInterface initialDocuments={[]} />)
    expect(screen.getAllByText('sidebar.dashboard')[0]).toBeInTheDocument()
  })

  it('groups documents correctly', async () => {
    // This test verifies the optimization logic:
    // Supplier A (2 docs) should be grouped.
    // Supplier B (1 doc) should be single.

    render(<DocumentsInterface initialDocuments={mockDocuments} />)

    // Switch to "All Documents" view to see the table
    const allDocsButton = screen.getAllByText('sidebar.allDocuments')[0];
    allDocsButton.click();

    await waitFor(() => {
        expect(screen.getByTestId('documents-table')).toBeInTheDocument();
    });

    // Check for Group Row
    expect(screen.getByText('Group: Supplier A (2)')).toBeInTheDocument()

    // Check for Single Row
    expect(screen.getByText('Single: Supplier B')).toBeInTheDocument()
  })
})
