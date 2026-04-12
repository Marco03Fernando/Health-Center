import React from 'react';
import { render } from '@testing-library/react';
import { SidebarProvider, Sidebar, SidebarContent } from './sidebar';

describe('Sidebar (ui)', () => {
  it('renders without crashing', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent />
        </Sidebar>
      </SidebarProvider>
    );
  });
});
