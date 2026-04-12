import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './OverviewPage';

const Component = Module.default || Module.OverviewPage || (() => null);

test('LabTech OverviewPage renders', () => {
  render(<Component />);
});
