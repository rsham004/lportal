'use client';

import * as React from 'react';
import { AppLayout, AppHeader, AppMain, AppSidebar, AppContent, AppFooter } from '@/components/ui/AppLayout';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Sidebar } from '@/components/shared/Sidebar';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <AppLayout>
      <AppHeader>
        <Header 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          showSidebarToggle={true}
        />
      </AppHeader>
      
      <AppMain withSidebar>
        <AppSidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        >
          <Sidebar variant="main" />
        </AppSidebar>
        
        <AppContent>
          <div className="container mx-auto px-4 py-6">
            <Breadcrumb className="mb-6" />
            {children}
          </div>
        </AppContent>
      </AppMain>
      
      <AppFooter>
        <Footer />
      </AppFooter>
    </AppLayout>
  )
}