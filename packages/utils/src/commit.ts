import {execFileAsync, promisifySpawn} from "./execute";
import {spawn} from "child_process";

export async function getCommitsSince(start: string | null, matchers: string[], maxCount: number = -1) {
    const range = start === null ? "" : `${start}..HEAD`;
    const maxCountParam = maxCount > -1 ? `--max-count=${maxCount}` : "";

    const gitlog = spawn(
        "git",
        ["log", range, "--pretty=format:%s%n%b", "--reverse", "-E", ...matchers.map(matcher => `--grep=${matcher}`), "--regexp-ignore-case", maxCountParam]
    )
    let commits = await promisifySpawn(gitlog);
    if (matchers.length > 0) {
        const args = ["-E", "-i"];
        matchers.forEach((matcher) => {
            args.push("-e");
            args.push(matcher);
        });
        const grep = spawn("grep", args);

        grep.stdin.write(commits);
        grep.stdin.end();

        commits = await promisifySpawn(grep);
    }
    return commits.trim();
}

export async function getLastCommitSHA(branch: string) {
    const sha = await execFileAsync("git", ["log", "-n", "1", "--pretty=format:%H", branch], {
        encoding: "utf-8",
    });
    return sha.stdout?.trim();
}

export async function forceTagCommit(tag: string, commitSHA: string) {
    const sha = await execFileAsync("git", ["tag", "-f", tag, commitSHA], {
        encoding: "utf-8",
    });
    return sha.stdout?.trim();
}
