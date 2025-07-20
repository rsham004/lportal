import type { Meta, StoryObj } from '@storybook/react';
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent, AppFooter } from './AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'UI/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AppLayout>
      <AppHeader>
        <div className="h-16 bg-primary text-primary-foreground flex items-center px-4">
          Header Content
        </div>
      </AppHeader>
      
      <AppMain>
        <AppContent>
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Main Content</h1>
            <p>This is the main content area of the application.</p>
          </div>
        </AppContent>
      </AppMain>
      
      <AppFooter>
        <div className="p-4 text-center text-muted-foreground">
          Footer Content
        </div>
      </AppFooter>
    </AppLayout>
  ),
};

export const WithSidebar: Story = {
  render: () => (
    <AppLayout>
      <AppHeader>
        <div className="h-16 bg-primary text-primary-foreground flex items-center px-4">
          Header with Sidebar Layout
        </div>
      </AppHeader>
      
      <AppMain withSidebar>
        <AppSidebar>
          <div className="p-4">
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><a href="#" className="block p-2 hover:bg-accent rounded">Dashboard</a></li>
              <li><a href="#" className="block p-2 hover:bg-accent rounded">Courses</a></li>
              <li><a href="#" className="block p-2 hover:bg-accent rounded">Profile</a></li>
            </ul>
          </div>
        </AppSidebar>
        
        <AppContent>
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Main Content with Sidebar</h1>
            <p>This layout includes a sidebar for navigation.</p>
          </div>
        </AppContent>
      </AppMain>
      
      <AppFooter>
        <div className="p-4 text-center text-muted-foreground">
          Footer Content
        </div>
      </AppFooter>
    </AppLayout>
  ),
};

export const CollapsibleSidebar: Story = {
  render: () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    
    return (
      <AppLayout>
        <AppHeader>
          <div className="h-16 bg-primary text-primary-foreground flex items-center px-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 p-2 hover:bg-primary-foreground/10 rounded"
            >
              ☰
            </button>
            Header with Collapsible Sidebar
          </div>
        </AppHeader>
        
        <AppMain withSidebar>
          <AppSidebar 
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li><a href="#" className="block p-2 hover:bg-accent rounded">Dashboard</a></li>
                <li><a href="#" className="block p-2 hover:bg-accent rounded">Courses</a></li>
                <li><a href="#" className="block p-2 hover:bg-accent rounded">Profile</a></li>
              </ul>
            </div>
          </AppSidebar>
          
          <AppContent>
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Collapsible Sidebar Layout</h1>
              <p>Click the hamburger menu to toggle the sidebar.</p>
            </div>
          </AppContent>
        </AppMain>
        
        <AppFooter>
          <div className="p-4 text-center text-muted-foreground">
            Footer Content
          </div>
        </AppFooter>
      </AppLayout>
    );
  },
};