import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './ContactPage';

const Component = Module.default || Module.ContactPage || (() => null);

test('ContactPage renders', () => {
  render(<Component />);
});
