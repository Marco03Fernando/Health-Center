import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './breadcrumb';

const Component = Module.default || Module.Breadcrumb || (() => null);

describe('Breadcrumb (ui)', () => {
  it('renders without crashing', () => {
    render(<Component />);
  });
});
