import execAsync from "./execute";

export async function getCommitsSince(start: string | null, maxCount: number = -1) {
    const range = start === null ? "" : `${start}..HEAD`;
    const maxCountParam = maxCount > -1 ? `--max-count=${maxCount}` : "";
    const command = `git log ${range} --pretty=format:"- %s" --reverse --grep="^feature/[a-zA-Z0-9]\\+:" --regexp-ignore-case ${maxCountParam}`;
    const commits = await execAsync(command, {
        encoding: "utf-8",
    })
    return commits.stdout?.trim();
}

export async function getLastCommitSHA(branch: string) {
    const sha = await execAsync(`git log -n 1 --pretty=format:"%H" ${branch}`, {
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
