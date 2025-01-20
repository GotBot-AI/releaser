import * as fs from "fs";
import execAsync from "./execute";
import {getCommitsSince} from "./commit";
import {ICommitMatchers} from "./interfaces";

// Get the current date
const getCurrentDate = () => {
    const currentDate = new Date();
    return currentDate.toISOString().split("T")[0];
}

// Create a new changelog file if it doesn't exist
const createChangelogFile = (changelogFile: string) => {
    fs.writeFileSync(changelogFile, "");
}

function getVersionBlockRegex(version: string) {
    // Regular expression to match the entire block for a utils
    return new RegExp(
        `## \\[${version}\\](.*?)(?=## \\[|$)`,
        "gs",
    );
}

export function getExistingVersionLog(version: string, changelogFile: string) {
    let changelog = fs.readFileSync(changelogFile, "utf-8");
    const versionBlockRegex = getVersionBlockRegex(version);
    const matches = changelog.match(versionBlockRegex)
    return matches ? matches[0] : "";
}

// Update the changelog with the new utils
export const changelog = (version: string, date: string, commits: string, changelogFile: string) => {
    let changelog = fs.readFileSync(changelogFile, "utf-8");

    const versionBlockRegex = getVersionBlockRegex(version);

    // If the utils block exists, replace it, otherwise append it
    const newChangelog = changelog.replace(versionBlockRegex, "");

    // Create new entry
    const newEntry = `## [${version}] - ${date}\n${commits}\n\n`;

    // Prepend the new entry
    fs.writeFileSync(changelogFile, newEntry + newChangelog);
}

export async function updateChangelog(
    fileName: string,
    newVersion: string,
    prevVersion: string | null,
    {
        breakingChange,
        feature,
        bugfix
    }: ICommitMatchers
) {
    // Check if the changelog file exists, create it if it doesn't
    if (!fs.existsSync(fileName)) {
        console.log("Changelog file does not exist. Creating a new one...");
        createChangelogFile(fileName);
    }

    const maxCommitCount = prevVersion === null ? 10 : -1;
    const commits = await getCommitsSince(prevVersion, [...breakingChange, ...feature, ...bugfix], maxCommitCount);

    if (!commits) {
        console.log("No new commits since last tag. Changelog is up-to-date.");
    } else {
        const date = getCurrentDate();
        const cleanCommitMessages = commits
            .split(/\n/)
            .map(commit => {
                // Clean up commit messages
                const commitParts = commit.split(":", 2);
                if (commit.length > 1) return `- ${commitParts[1]?.trim()}`;
                return commitParts[0];
            });
        const uniqueCommitMessages = [...new Set(cleanCommitMessages)];

        console.log(`Updating changelog for version ${newVersion}`);
        changelog(newVersion, date, uniqueCommitMessages.join("\n"), fileName);
        console.log(`Changelog updated for version ${newVersion}`);

        await execAsync(`git add ${fileName}`);
    }

    await execAsync(`git commit --allow-empty -m "Prepared changelog"`);
}