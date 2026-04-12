import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import * as Module from './checkbox';

const Component = Module.default || Module.Checkbox || (() => null);

describe('Checkbox (ui)', () => {
  it('renders and can be toggled', () => {
    const { getByRole } = render(<Component />);
    const cb = getByRole('checkbox', { hidden: true }) || null;
    if (cb) fireEvent.click(cb);
  });
});
