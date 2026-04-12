import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './CenterInfoPage';

const Component = Module.default || Module.CenterInfoPage || (() => null);

test('CenterInfoPage renders', () => {
  render(<Component />);
});
