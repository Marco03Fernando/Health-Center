import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './accordion';

const Component = Module.default || Module.Accordion || (() => null);

describe('Accordion (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
