import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider, Toast, ToastViewport } from './toast';

describe('Toast (ui)', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <Toast>
          <span>Test toast</span>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  });
});
