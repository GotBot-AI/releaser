import execAsync from "./execute";

export async function getCommitsSince(start: string | null, matchers: string[], maxCount: number = -1) {
    const range = start === null ? "" : `${start}..HEAD`;
    const maxCountParam = maxCount > -1 ? `--max-count=${maxCount}` : "";

    let matcherStringForGit = matchers.map(matcher => `--grep="${matcher}"`).join(" ")
    if (matcherStringForGit) matcherStringForGit += " -E"

    let grepPipe = matchers.map(matcher => `-e "${matcher}"`).join(" ")
    if (grepPipe) grepPipe = "| grep -E -i " + grepPipe;

    const command = `git log ${range} --pretty=format:"%s%n%b" --reverse ${matcherStringForGit} --regexp-ignore-case ${maxCountParam} ${grepPipe}`;
    const {stdout: commits} = await execAsync(command, {
        encoding: "utf-8",
    })
    return commits.trim();
}

export async function getLastCommitSHA(branch: string) {
    const sha = await execAsync(`git log -n 1 --pretty=format:"%H" "${branch}"`, {
        encoding: "utf-8",
    })
    return sha.stdout?.trim();
}

export async function forceTagCommit(tag: string, commitSHA: string) {
    const sha = await execAsync(`git tag -f ${tag} "${commitSHA}"`, {
        encoding: "utf-8",
    })
    return sha.stdout?.trim();
}
