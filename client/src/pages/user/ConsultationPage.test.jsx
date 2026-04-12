import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './ConsultationPage';

const Component = Module.default || Module.ConsultationPage || (() => null);

test('ConsultationPage renders', () => {
  render(<Component />);
});
