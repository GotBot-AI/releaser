import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    fetchBranchWithTags,
    fetchOriginUnshallow,
    getExistingVersionLog,
    getLastCommitSHA,
    getLastVersionTag,
    getNextVersion,
    setupLocalUser
} from "@releaser/utils";

async function main() {
    try {
        core.info(`Running release action"...`);
        const changelogFileName = core.getInput("changelog-file-name");
        const includeDefaultCommitMatchers = core.getInput("include-default-commit-matchers") === "true";
        const defaultBreakingChangeCommitMatchers = ["BREAKING CHANGE"];
        const breakingChangeCommitMatchers = core.getInput("breaking-change-commit-matchers").split("\n");
        const defaultFeatureCommitMatchers = ["^feature/[a-zA-Z0-9 -]+:", "^feat/[a-zA-Z0-9 -]+:"];
        const featureCommitMatchers = core.getInput("feature-commit-matchers").split("\n");
        const defaultBugfixCommitMatchers = ["^feature/[a-zA-Z0-9 -]+ (PATCH):", "^bugfix/[a-zA-Z0-9 -]+:", "^fix/[a-zA-Z0-9 -]+:", "^(PATCH)"];
        const bugfixCommitMatchers = core.getInput("bugfix-commit-matchers").split("\n");
        const commitMatchers = {
            breakingChange: [...new Set(breakingChangeCommitMatchers.concat(includeDefaultCommitMatchers ? defaultBreakingChangeCommitMatchers : []))],
            feature: [...new Set(featureCommitMatchers.concat(includeDefaultCommitMatchers ? defaultFeatureCommitMatchers : []))],
            bugfix: [...new Set(bugfixCommitMatchers.concat(includeDefaultCommitMatchers ? defaultBugfixCommitMatchers : []))],
        };
        const releaseBranch = core.getInput("release-branch");
        const githubToken = core.getInput("github-token");
        const skipGithubRelease = core.getInput("skip-github-release") === "true";
        const octokit = github.getOctokit(githubToken);
        const {owner, repo} = github.context.repo;

        // !!These need to be placed here before any other git commands are run!!
        await setupLocalUser();
        await fetchOriginUnshallow();
        await fetchBranchWithTags(releaseBranch);
        const lastCommitSHA = await getLastCommitSHA(releaseBranch);

        const prevVersion = await getLastVersionTag(releaseBranch);
        let newVersion = "v1.0.0";
        if (prevVersion === null) {
            core.info(`No previous version found. starting at ${newVersion}.`);
        } else {
            core.info(`Previous version: ${prevVersion}.`);
            newVersion = await getNextVersion(prevVersion, commitMatchers);
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

        if (!skipGithubRelease) {
            core.info(`Creating GitHub release for "${newVersion}"...`);
            const {data: release} = await octokit.rest.repos.createRelease({
                owner,
                repo,
                tag_name: newVersion,
                name: newVersion,
                body: getExistingVersionLog(newVersion, changelogFileName),
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