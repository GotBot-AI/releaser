import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    checkoutBranch,
    createAndCheckoutBranch,
    fetchBranchWithTags,
    fetchOriginUnshallow,
    forcePushCommits, getExistingVersionLog,
    getLastCommitSHA,
    getLastVersionTag,
    getNextVersion,
    resetBranchToBranch,
    setupLocalUser,
    updateChangelog
} from "@releaser/utils";

async function main() {
    try {
        core.info(`Running changelog action"...`);
        const changelogFileName = core.getInput("changelog-file-name");
        const releaseBranch = core.getInput("release-branch");
        const sourceBranch = core.getInput("source-branch");
        const breakingChangeCommitMatchers = core.getInput("breaking-change-commit-matchers").split("\n");
        const featureCommitMatchers = core.getInput("feature-commit-matchers").split("\n");
        const bugfixCommitMatchers = core.getInput("bugfix-commit-matchers").split("\n");
        const commitMatchers = {
            breakingChange: breakingChangeCommitMatchers,
            feature: featureCommitMatchers,
            bugfix: bugfixCommitMatchers
        };
        const changelogBranch = `changelog--branch-${sourceBranch}`;
        const githubToken = core.getInput("github-token");
        const octokit = github.getOctokit(githubToken);

        // !!These need to be placed here before any other git commands are run!!
        await setupLocalUser();
        await fetchOriginUnshallow()
        await checkoutBranch(releaseBranch)
        await fetchBranchWithTags(releaseBranch);
        await checkoutBranch(sourceBranch)
        await fetchBranchWithTags(sourceBranch);
        const lastCommitSHA = await getLastCommitSHA(sourceBranch);

        const prevVersion = await getLastVersionTag(releaseBranch);
        let newVersion = "v1.0.0";
        if (prevVersion === null) {
            core.info(`No previous version found. starting at ${newVersion}.`);
        } else {
            core.info(`Previous version: ${prevVersion}.`);
            newVersion = await getNextVersion(prevVersion, commitMatchers);
            core.info(`New version: ${newVersion}.`);
        }

        const {owner, repo} = github.context.repo;
        const {data: branches} = await octokit.rest.repos.listBranches({
            owner: owner,
            repo: repo,
        });

        core.info(`Checking for merged changelog pull request corresponding to ${lastCommitSHA}.`);
        const prs = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${owner}/${repo} is:pr is:merged ${lastCommitSHA} base:${sourceBranch} head:${changelogBranch}`,
        });

        const mergedChangelogPRs = prs.data.items;
        // Release Step
        if (mergedChangelogPRs.length > 0) {
            // const pr = mergedChangelogPRs[0]; // Assuming the first result is the match
            return;
        }
        // Release Preparation Step
        else {
            core.info("No corresponding merged changelog pull request found.");
            const changelogBranchExists = branches.some((branch) => branch.name === changelogBranch);
            if (changelogBranchExists) {
                core.info(`Branch "${changelogBranch}" already exists. Resetting "${changelogBranch}" to match "${sourceBranch}"...`);
                await checkoutBranch(changelogBranch);
                await resetBranchToBranch(changelogBranch, sourceBranch);
                core.info(`Branch "${changelogBranch}" has been reset to "${sourceBranch}".`);
            } else {
                core.info(`Creating branch "${changelogBranch}" from "${sourceBranch}"...`);
                await createAndCheckoutBranch(changelogBranch, sourceBranch);
                core.info(`Branch "${changelogBranch}" has been created from "${sourceBranch}".`);
            }

            await updateChangelog(changelogFileName, newVersion, prevVersion, commitMatchers);
            await forcePushCommits(changelogBranch);

            const {data: existingPrs} = await octokit.rest.pulls.list({
                owner: owner,
                repo: repo,
                head: `${owner}:${changelogBranch}`,
                base: sourceBranch,
            });

            if (existingPrs.length === 0) {
                core.info(`Creating a new PR from "${changelogBranch}" to "${sourceBranch}"...`);
                await octokit.rest.pulls.create({
                    owner: owner,
                    repo: repo,
                    title: `PR to merge "${changelogBranch}" into ${sourceBranch}`,
                    head: changelogBranch,
                    base: sourceBranch,
                    body: getExistingVersionLog(newVersion, changelogFileName),
                });
                core.info(`PR to merge "${changelogBranch}" into ${sourceBranch} has been created.`);
                core.setOutput("pr-created", true);
            } else {
                core.info(`Updating a new PR from "${changelogBranch}" to "${sourceBranch}"...`);
                await octokit.rest.pulls.update({
                    owner: owner,
                    repo: repo,
                    pull_number: existingPrs[0].number,
                    body: getExistingVersionLog(newVersion, changelogFileName),
                });
                core.info(`PR to merge "${changelogBranch}" into ${sourceBranch} has been updated.`);
                core.setOutput("pr-created", false);
            }
            core.info(`Branch "${changelogBranch}" is now in sync with "${sourceBranch}", and the PR is updated.`);
        }
    } catch (error: any) {
        core.error(error)
        core.setFailed(error.message);
    }
}

main()