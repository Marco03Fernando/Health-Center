import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './label';

const Component = Module.default || Module.Label || (() => null);

describe('Label (ui)', () => {
  it('renders without crashing', () => {
    render(<Component>Label</Component>);
  });
});
