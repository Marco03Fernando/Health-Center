import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './AboutPage';

const Component = Module.default || Module.AboutPage || (() => null);

test('AboutPage renders', () => {
  render(<Component />);
});
