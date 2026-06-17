// `harness doctor` - validate installed target.

import { doctor as doctorImpl } from '../lib/doctor.mjs';

export async function doctor(args, opts) {
  return await doctorImpl(process.cwd());
}
