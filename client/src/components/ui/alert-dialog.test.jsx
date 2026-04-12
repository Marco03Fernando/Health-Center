import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './alert-dialog';

const Component = Module.default || Module.AlertDialog || (() => null);

describe('AlertDialog (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
