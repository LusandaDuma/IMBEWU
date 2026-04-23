/**
 * @fileoverview Backward-compatible redirect from /auth/signup to /auth/register.
 */

import { Redirect } from 'expo-router';

export default function SignupScreen() {
  return <Redirect href="/auth/register" />;
}
