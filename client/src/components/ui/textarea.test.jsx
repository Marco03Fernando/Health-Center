import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import * as Module from './textarea';

const Component = Module.default || Module.Textarea || (() => null);

describe('Textarea (ui)', () => {
  it('renders and accepts input', () => {
    const { getByRole } = render(<Component />);
    const textarea = getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello' } });
  });
});
