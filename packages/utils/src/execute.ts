import {ChildProcessWithoutNullStreams, execFile} from 'child_process';
import util from 'util';

export const execFileAsync = util.promisify(execFile);

export const promisifySpawn = (inputSpawn: ChildProcessWithoutNullStreams): Promise<string> => {
    return new Promise((resolve, reject) => {
        let output = "";
        inputSpawn.stdout.on("data", (data) => (output += data.toString()));
        inputSpawn.on("error", reject);
        inputSpawn.on("close", (code) => {
            code === 0
                ? resolve(output)
                : reject(new Error(`grep process exited with code ${code}`));
        });
    });
}