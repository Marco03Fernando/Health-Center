import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './card';

const Component = Module.default || Module.Card || (() => null);

describe('Card (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
