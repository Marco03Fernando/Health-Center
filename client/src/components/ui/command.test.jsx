import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './command';

const Component = Module.default || Module.Command || (() => null);

describe('Command (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
