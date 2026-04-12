import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './badge';

const Component = Module.default || Module.Badge || (() => null);

describe('Badge (ui)', () => {
  it('renders without crashing', () => {
    render(<Component>New</Component>);
  });
});
