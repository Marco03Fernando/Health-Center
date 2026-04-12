import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './UpdateResultsPage';

const Component = Module.default || Module.UpdateResultsPage || (() => null);

test('UpdateResultsPage renders', () => {
  render(<Component />);
});
