import * as core from '@actions/core';
import * as github from '@actions/github';
import {
    createBranch,
    fetchBranchWithTags,
    forcePushCommits,
    getLastCommitSHA,
    getLastVersionTag,
    getNextVersion,
    resetBranchToBranch,
    setupLocalUser,
    updateChangelog
} from "@releaser/utils";

async function main() {
    try {
        core.info(`Running release action"...`);
        const fileName = core.getInput("file-name");
        const targetBranch = core.getInput("target-branch");
        const sourceBranch = core.getInput("source-branch");
        const changelogBranch = `changelog--branch-${targetBranch}`;
        const githubToken = core.getInput("github-token");
        const octokit = github.getOctokit(githubToken);

        // !!These need to be placed here before any other git commands are run!!
        await setupLocalUser();
        await fetchBranchWithTags(sourceBranch);
        await fetchBranchWithTags(targetBranch);
        const lastCommitSHA = await getLastCommitSHA(sourceBranch);
        core.info(`Source branch is ${sourceBranch}.`);

        const prevVersion = await getLastVersionTag(targetBranch);
        let newVersion = "v1.0.0";
        if (prevVersion === null) {
            core.info(`No previous version found. starting at ${newVersion}.`);
        } else {
            core.info(`Previous version: ${prevVersion}.`);
            newVersion = await getNextVersion(prevVersion);
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

        const mergedReleasePRs = prs.data.items;
        // Release Step
        if (mergedReleasePRs.length > 0) {
            // const pr = mergedReleasePRs[0]; // Assuming the first result is the match
            return;
        }
        // Release Preparation Step
        else {
            core.info("No corresponding merged changelog pull request found.");
            const changelogBranchExists = branches.some((branch) => branch.name === changelogBranch);
            if (changelogBranchExists) {
                core.info(`Branch "${changelogBranch}" already exists. Resetting "${changelogBranch}" to match "${sourceBranch}"...`);
                await resetBranchToBranch(changelogBranch, sourceBranch);
                core.info(`Branch "${changelogBranch}" has been reset to "${sourceBranch}".`);
            } else {
                core.info(`Creating branch "${changelogBranch}" from "${sourceBranch}"...`);
                await createBranch(changelogBranch, sourceBranch);
                core.info(`Branch "${changelogBranch}" has been created from "${sourceBranch}".`);
            }

            await updateChangelog(fileName, newVersion, prevVersion);
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
                    body: 'This PR contains release-related changes applied to the branch.',
                });
                core.info(`PR to merge "${changelogBranch}" into ${sourceBranch} has been created.`);
                core.setOutput("pr-created", true);
            } else {
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