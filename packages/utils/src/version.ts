import {getCommitsSince} from "./commit";
import {execFileAsync} from "./execute";
import {ICommitMatchers} from "./interfaces";

export async function getLastVersionTag(branch: string) {
    try {
        const latestTag = await execFileAsync("git", ["describe", "--tags", "--abbrev=0", "--match", "v*", `origin/${branch}`], {
            encoding: "utf-8",
        })
        return latestTag.stdout?.trim();
    } catch (error) {
        return null;
    }
}

// Determine the new utils based on commit messages
export async function getNextVersion(lastVersion: string, {breakingChange, feature, bugfix}: ICommitMatchers) {
    let [major, minor, patch] = lastVersion.slice(1).split(".").map(Number); // Remove 'v' and split the utils

    const commits = await getCommitsSince(lastVersion, [...breakingChange, ...feature, ...bugfix]);
    // Check for breaking changes (major utils bump)
    if (breakingChange.some(matcher => commits.replace(/^- /gm, "").match(new RegExp(matcher, "gim")))) {
        major++;
        minor = 0;
        patch = 0;
    }
    // Check for features (minor utils bump)
    else if (feature.some(matcher => commits.replace(/^- /gm, "").match(new RegExp(matcher, "gim")))) {
        minor++;
        patch = 0;
    }
    // Check for fixes (patch utils bump)
    // else if (commits.match(/bugfix\/[a-zA-Z0-9]+:/i)) {
    else {
        patch++;
    }

    return `v${major}.${minor}.${patch}`;
}