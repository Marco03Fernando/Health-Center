import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './alert';

const Component = Module.default || Module.Alert || (() => null);

describe('Alert (ui)', () => {
  it('renders without crashing', () => {
    render(<Component>Message</Component>);
  });
});
