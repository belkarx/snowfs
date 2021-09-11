import * as fse from 'fs-extra';
import * as crypto from 'crypto';
import { sleep } from './common';

/**
 * Write data to a file and replacing the file if it already exists.
 * In comparision to `fs.writeFile`, this function ensures that the file got written
 * to disk successfully before placing it at the expected path. This is achieved by
 * an atomic **rename** of a temporary file, where the content is first written to.
 * `data` can be a string, a buffer, or an object with an own toString function property.
 * The promise is resolved with no arguments upon success.
 *
 *
 * @param path      Path of the target file.
 * @param data      Data object to write to the file
 * @param options   For more information see the [docs](https://nodejs.org/api/fs.html#fs_filehandle_writefile_data_options)
 * @returns
 */
export async function writeSafeFile(path: string, data: any, options?: string | fse.WriteFileOptions): Promise<void> {
  const tmp = crypto.createHash('sha256').update(process.hrtime().toString()).digest('hex').substring(0, 6);
  const tmpPath = `${path}.${tmp}.tmp`;

  await fse.writeFile(tmpPath, data, options)

  for (let i = 0; i < 3; ++i) {
    try {
      await fse.rename(tmpPath, path);
      break;
    } catch (error) {
      await sleep(1000);
      if (i == 2) {
        await fse.unlink(tmpPath);
      }
      continue;
    }
  }
}
