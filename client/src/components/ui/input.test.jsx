import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import * as Module from './input';

const Component = Module.default || Module.Input || (() => null);

describe('Input (ui)', () => {
  it('renders and accepts input', () => {
    const { getByRole } = render(<Component />);
    const el = getByRole('textbox');
    fireEvent.change(el, { target: { value: 'test' } });
  });
});
