import execAsync from "./execute";

export async function forcePushCommits(branchName: string) {
    await execAsync(`git push origin ${branchName} --force`);
}

export async function forcePushTag(tag: string) {
    await execAsync(`git push ${tag} --force`);
}

export async function fetchBranchWithTags(branchName: string) {
    await execAsync(`git fetch origin ${branchName} --unshallow`);
    await execAsync(`git fetch --tags origin ${branchName}`);
}