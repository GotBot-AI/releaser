import * as fs from "fs";
import execAsync from "./execute";
import {getCommitsSince} from "./commit";

// Get the current date
const getCurrentDate = () => {
    const currentDate = new Date();
    return currentDate.toISOString().split("T")[0];
}

// Create a new changelog file if it doesn't exist
const createChangelogFile = (changelogFile: string) => {
    fs.writeFileSync(changelogFile, "");
}

function buildVersionBlockRegex(version: string) {
    // Regular expression to match the entire block for a version
    return new RegExp(
        `## \\[${version}\\](.*?)(?=## \\[|$)`,
        "gs",
    );
}

export function getExistingVersionLog(version: string, changelogFile: string) {
    let changelog = fs.readFileSync(changelogFile, "utf-8");
    const versionBlockRegex = buildVersionBlockRegex(version);
    const matches = changelog.match(versionBlockRegex)
    return matches ? matches[0] : "";
}

// Update the changelog with the new version
export const changelog = (version: string, date: string, commits: string, changelogFile: string) => {
    let changelog = fs.readFileSync(changelogFile, "utf-8");

    const versionBlockRegex = buildVersionBlockRegex(version);

    // If the version block exists, replace it, otherwise append it
    const newChangelog = changelog.replace(versionBlockRegex, "");

    // Create new entry
    const newEntry = `## [${version}] - ${date}\n${commits}\n\n`;

    // Prepend the new entry
    fs.writeFileSync(changelogFile, newEntry + newChangelog);
}

export async function updateChangelog(fileName: string, newVersion: string, prevVersion: string) {
    // Check if the changelog file exists, create it if it doesn't
    if (!fs.existsSync(fileName)) {
        console.log("Changelog file does not exist. Creating a new one...");
        createChangelogFile(fileName);
    }

    const commits = await getCommitsSince(prevVersion);

    if (!commits) {
        console.log("No new commits since last tag. Changelog is up-to-date.");
        return;
    }

    const date = getCurrentDate();

    changelog(newVersion, date, commits, fileName);
    console.log(`Changelog updated for version ${newVersion}`);

    await execAsync(`git add ${fileName}`);
    await execAsync(`git commit  -m "Prepared release"`);
}