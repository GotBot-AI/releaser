import execAsync from "./execute";

export async function forcePush(branchName: string) {
    await execAsync(`git push origin ${branchName} --force`);
}

export async function fetchBranchWithTags(branchName: string) {
    await execAsync(`git fetch origin ${branchName} --unshallow`);
    await execAsync(`git fetch --tags origin ${branchName}`);
}