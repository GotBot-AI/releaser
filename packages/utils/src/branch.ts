import execAsync from "./execute";

export async function checkoutBranch(branchName: string) {
    await execAsync(`git checkout ${branchName}`);
}

export async function createAndCheckoutBranch(branchName: string, baseBranch: string) {
    await execAsync(`git checkout ${baseBranch}`);
    await execAsync(`git pull origin ${baseBranch}`);
    await execAsync(`git checkout -b ${branchName}`);
}

export async function resetBranchToBranch(branchName: string, targetBranch: string) {
    await execAsync(`git pull origin ${branchName}`);
    await execAsync(`git reset --hard origin/${targetBranch}`);
}

export async function branchContainsCommit(branchName: string, commitSHA: string) {
    const {stdout} = await execAsync(`git branch --contains ${commitSHA}`);
    return stdout?.trim().includes(branchName);
}