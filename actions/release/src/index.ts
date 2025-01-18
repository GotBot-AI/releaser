import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    fetchBranchWithTags,
    getExistingVersionLog,
    getLastCommitSHA,
    getLastVersionTag,
    getNextVersion,
    setupLocalUser
} from "@releaser/utils";

async function main() {
    try {
        core.info(`Running release action"...`);
        const fileName = core.getInput("file-name");
        const targetBranch = core.getInput("target-branch");
        const githubToken = core.getInput("github-token");
        const skipGithubRelease = core.getInput("skip-github-release");
        const octokit = github.getOctokit(githubToken);
        const {owner, repo} = github.context.repo;

        // !!These need to be placed here before any other git commands are run!!
        await setupLocalUser();
        await fetchBranchWithTags(targetBranch);
        const lastCommitSHA = await getLastCommitSHA(targetBranch);

        const prevVersion = await getLastVersionTag(targetBranch);
        let newVersion = "v1.0.0";
        if (prevVersion === null) {
            core.info(`No previous version found. starting at ${newVersion}.`);
        } else {
            core.info(`Previous version: ${prevVersion}.`);
            newVersion = await getNextVersion(prevVersion);
            core.info(`New version: ${newVersion}.`);
        }

        core.info(`Creating tag for ${lastCommitSHA}.`);
        const {data: tag} = await octokit.rest.git.createTag({
            owner,
            repo,
            tag: newVersion,
            message: `Tagging commit as version ${newVersion}.`,
            object: lastCommitSHA,
            type: "commit",
        });
        core.info(`Created tag: ${tag.tag}`);

        core.info(`Creating reference for "${newVersion}" on "${lastCommitSHA}"...`);
        const {data: ref} = await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/tags/${newVersion}`,
            sha: lastCommitSHA,
        });
        core.info(`Created reference: ${ref.ref}`);

        if (skipGithubRelease !== "true") {
            core.info(`Creating GitHub release for "${newVersion}"...`);
            const {data: release} = await octokit.rest.repos.createRelease({
                owner,
                repo,
                tag_name: newVersion,
                name: newVersion,
                body: getExistingVersionLog(newVersion, fileName),
                draft: false,
                prerelease: false,
            });
            console.log(`Created release: ${release.html_url}`);
            core.setOutput("release-created", true);
        } else {
            core.setOutput("release-created", false);
        }
    } catch (error: any) {
        core.error(error)
        core.setFailed(error.message);
    }
}

main()