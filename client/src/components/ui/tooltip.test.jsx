import React from 'react';
import { render, screen } from '@testing-library/react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

describe('Tooltip (ui)', () => {
  it('renders without crashing', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  });

  it('shows trigger text', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeTruthy();
  });
});
