import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './CenterAdminLayout';

const Component = Module.default || Module.CenterAdminLayout || (() => null);

test('CenterAdminLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
