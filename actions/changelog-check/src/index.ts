import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    branchContainsCommit,
    checkoutBranch,
    fetchBranchWithTags,
    fetchOriginUnshallow,
    getLastCommitSHA,
    setupLocalUser
} from "@releaser/utils";

async function main() {
    try {
        core.info(`Running changelog check action"...`);
        const sourceBranch = core.getInput("source-branch");
        const changelogBranch = `changelog--branch-${sourceBranch}`;
        const githubToken = core.getInput("github-token");
        const octokit = github.getOctokit(githubToken);

        // !!These need to be placed here before any other git commands are run!!
        await setupLocalUser();
        await fetchOriginUnshallow();
        await checkoutBranch(sourceBranch)
        await fetchBranchWithTags(sourceBranch);
        const lastSourceBranchCommitSHA = await getLastCommitSHA(sourceBranch);
        await checkoutBranch(changelogBranch)
        const lastChangelogBranchCommitSHA = await getLastCommitSHA(changelogBranch);
        const {owner, repo} = github.context.repo;

        core.info(`Checking for merged changelog pull request corresponding to ${lastSourceBranchCommitSHA}.`);
        const prs = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${owner}/${repo} is:pr is:merged ${lastSourceBranchCommitSHA} base:${sourceBranch} head:${changelogBranch}`,
        });

        const changelogPRs = prs.data.items;
        // Release Step
        if (changelogPRs.length > 0) {
            core.info(`All good`);
            core.setOutput("changelog-is-synced", true);
        } else {
            core.info(`No corresponding merged changelog pull request found. Checking if ${changelogBranch} contains latest changes from ${sourceBranch}`);
            const changelogBranchUpToDate = await branchContainsCommit(changelogBranch, lastSourceBranchCommitSHA);
            if (!changelogBranchUpToDate) {
                core.setOutput("changelog-is-synced", false);
                core.setFailed(`${changelogBranch} doesn't contain latest changes from ${sourceBranch}`);
            } else if (lastChangelogBranchCommitSHA !== lastSourceBranchCommitSHA) {
                core.setOutput("changelog-is-synced", false);
                core.setFailed(`${changelogBranch} hasn't been merged into ${sourceBranch}`);
            } else {
                core.info(`All good`);
                core.setOutput("changelog-is-synced", true);
            }
        }
    } catch (error: any) {
        core.error(error)
        core.setFailed(error.message);
    }
}

main()