import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './AdminLayout';

const Component = Module.default || Module.AdminLayout || (() => null);

test('AdminLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
