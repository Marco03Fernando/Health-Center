import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './calendar';

const Component = Module.default || Module.Calendar || (() => null);

describe('Calendar (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
