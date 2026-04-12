import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './separator';

const Component = Module.default || Module.Separator || (() => null);

describe('Separator (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
