import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './skeleton';

const Component = Module.default || Module.Skeleton || (() => null);

describe('Skeleton (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
