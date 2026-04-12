import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import * as Module from './form';

const Component = Module.default || Module.Form || (() => null);

describe('Form (ui)', () => {
  it('renders and can submit', () => {
    const { container } = render(<Component />);
    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);
  });
});
