import {execFileAsync} from "./execute";

export async function forcePushCommits(branchName: string) {
    await execFileAsync("git", ["push", "origin", branchName, "--force"]);
}

export async function fetchOriginUnshallow() {
    await execFileAsync("git", ["fetch", "origin", "--unshallow"]);
}

export async function fetchBranchWithTags(branchName: string) {
    await execFileAsync("git", ["fetch", "origin", branchName]);
    await execFileAsync("git", ["fetch", "--tags", "origin", branchName]);
}