import execAsync from "./execute";

export async function getCommitsSince(start: string) {
    const commits = await execAsync(`git log ${start}..HEAD --pretty=format:"- %s" --reverse --grep="^feature/[a-zA-Z0-9]\\+:" --regexp-ignore-case`, {
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