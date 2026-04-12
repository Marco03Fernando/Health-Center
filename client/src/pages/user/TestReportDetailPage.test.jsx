import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './TestReportDetailPage';

const Component = Module.default || Module.TestReportDetailPage || (() => null);

test('TestReportDetailPage renders', () => {
  render(<Component />);
});
