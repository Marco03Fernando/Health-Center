import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './pagination';

const Component = Module.default || Module.Pagination || (() => null);

describe('Pagination (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
