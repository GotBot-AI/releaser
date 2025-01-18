import execAsync from "./execute";

export async function forcePushCommits(branchName: string) {
    await execAsync(`git push origin ${branchName} --force`);
}

export async function forcePushTag(tag: string) {
    await execAsync(`git push ${tag} --force`);
}

export async function fetchBranchWithTags(branchName: string) {
    const {stdout: isShallow} = await execAsync(`git rev-parse --is-shallow-repository`, {
        encoding: "utf-8",
    });
    const suffix = isShallow === "true" ? "--unshallow" : "";
    await execAsync(`git fetch origin ${branchName} ${suffix}`);
    await execAsync(`git fetch --tags origin ${branchName}`);
}