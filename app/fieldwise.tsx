/**
 * @fileoverview Legacy route — Fieldwise was renamed to Nolwazi.
 */

import { Redirect } from 'expo-router';

export default function FieldwiseRedirect() {
  return <Redirect href="/nolwazi" />;
}
