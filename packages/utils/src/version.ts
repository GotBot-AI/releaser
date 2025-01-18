import {getCommitsSince} from "./commit";
import execAsync from "./execute";

export async function getLastVersionTag(branch: string) {
    try {
        await execAsync(`git fetch --tags`);
        const latestTag = await execAsync(`git describe --tags --abbrev=0 --match "v*" origin/${branch}`, {
            encoding: "utf-8",
        })
        return latestTag.stdout.trim();
    } catch (error) {
        return null;
    }
}

// Determine the new utils based on commit messages
export async function getNextVersion(lastVersion: string) {
    let [major, minor, patch] = lastVersion.slice(1).split(".").map(Number); // Remove 'v' and split the utils

    const commits = await getCommitsSince(lastVersion);
    // Check for breaking changes (major utils bump)
    if (commits.match(/BREAKING CHANGE/i)) {
        major++;
        minor = 0;
        patch = 0;
    }
    // Check for features (minor utils bump)
    else if (commits.match(/feature\/[a-zA-Z0-9]+:/i)) {
        minor++;
        patch = 0;
    }
    // Check for fixes (patch utils bump)
    else if (commits.match(/bugfix\/[a-zA-Z0-9]+:/i)) {
        patch++;
    }

    return `v${major}.${minor}.${patch}`;
}