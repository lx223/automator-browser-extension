import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const template = {
  version: 'v2',
  clean: true,
  plugins: [
    {
      local: 'protoc-gen-es',
      out: 'src/generated',
      opt: ['target=ts'],
    },
  ],
};

execFileSync('buf', ['generate', 'proto', '--template', JSON.stringify(template)], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  stdio: 'inherit',
});
