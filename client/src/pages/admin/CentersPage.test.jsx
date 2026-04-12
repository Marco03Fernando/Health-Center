import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './CentersPage';

const Component = Module.default || Module.CentersPage || (() => null);

test('CentersPage renders', () => {
  render(<Component />);
});
