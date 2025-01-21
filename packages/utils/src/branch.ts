import {execFileAsync} from "./execute";

export async function checkoutBranch(branchName: string) {
    await execFileAsync("git", ["checkout", branchName]);
}

export async function createAndCheckoutBranch(branchName: string, baseBranch: string) {
    await execFileAsync("git", ["checkout", baseBranch]);
    await execFileAsync("git", ["pull", "origin", baseBranch]);
    await execFileAsync("git", ["checkout", "-b", branchName]);
}

export async function resetBranchToBranch(branchName: string, targetBranch: string) {
    await execFileAsync("git", ["pull", "origin", branchName]);
    await execFileAsync("git", ["reset", "--hard", `origin/${targetBranch}`]);
}

export async function branchContainsCommit(branchName: string, commitSHA: string) {
    const {stdout} = await execFileAsync("git", ["branch", "--contains", commitSHA]);
    return stdout?.trim().includes(branchName);
}