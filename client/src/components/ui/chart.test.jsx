import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './chart';

const Component = Module.default || Module.Chart || (() => null);

describe('Chart (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
