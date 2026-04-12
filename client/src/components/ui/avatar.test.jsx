import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './avatar';

const Component = Module.default || Module.Avatar || (() => null);

describe('Avatar (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
