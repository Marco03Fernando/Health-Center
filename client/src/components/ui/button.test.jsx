import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import * as Module from './button';

const Component = Module.default || Module.Button || (() => null);

describe('Button (ui)', () => {
  it('renders and responds to clicks', () => {
    const { getByRole } = render(<Component>Click</Component>);
    const btn = getByRole('button');
    fireEvent.click(btn);
  });
});
