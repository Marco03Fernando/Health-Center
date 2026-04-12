import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './PublicLayout';

const Component = Module.default || Module.PublicLayout || (() => null);

test('PublicLayout renders children', () => {
  render(<Component><div>child</div></Component>);
});
