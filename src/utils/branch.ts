import execAsync from "./execute";

export async function createBranch(branchName: string, baseBranch: string) {
    await execAsync('git fetch origin');
    await execAsync(`git checkout ${baseBranch}`);
    await execAsync(`git pull origin ${baseBranch}`);
    await execAsync(`git checkout -b ${branchName}`);
}

export async function resetBranchToBranch(branchName: string, targetBranch: string) {
    await execAsync(`git fetch origin`);
    await execAsync(`git checkout ${branchName}`);
    await execAsync(`git pull origin ${branchName}`);
    await execAsync(`git reset --hard origin/${targetBranch}`);
}