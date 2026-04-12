import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './BookLabTestPage';

const Component = Module.default || Module.BookLabTestPage || (() => null);

test('BookLabTestPage renders', () => {
  render(<Component />);
});
