import * as core from '@actions/core';
import * as github from '@actions/github';
import {getExistingVersionLog, updateChangelog} from "./utils/changelog";
import {createBranch, resetBranchToBranch} from "./utils/branch";
import {fetchBranchWithTags, forcePush} from "./utils/origin";
import {setupLocalUser} from "./utils/user";
import {getLastVersionTag, getNewVersion} from "./utils/version";
import {getLastCommitSHA} from "./utils/commit";

async function main() {
    try {
        core.info(`Running release action"...`);
        const fileName = core.getInput("file-name");
        const targetBranch = core.getInput("target-branch");
        const githubToken = core.getInput("github-token");
        const skipGithubRelease = core.getInput("skip-github-release");

        const octokit = github.getOctokit(githubToken);

        await setupLocalUser();
        await fetchBranchWithTags(targetBranch);
        const prevVersion = await getLastVersionTag(targetBranch);
        core.info(`Previous version: ${prevVersion}.`);
        const newVersion = await getNewVersion(prevVersion);
        core.info(`New version: ${newVersion}.`);
        const releaseBranch = `release-action--branch-${targetBranch}`;

        const lastCommitSHA = await getLastCommitSHA(targetBranch);
        const {owner, repo} = github.context.repo;
        const {data: branches} = await octokit.rest.repos.listBranches({
            owner: owner,
            repo: repo,
        });

        core.info(`Checking for merged release pull request corresponding to ${lastCommitSHA}.`);
        const prs = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${owner}/${repo} is:pr is:merged ${lastCommitSHA} base:${targetBranch} head:${releaseBranch}`,
        });

        const mergedReleasePRs = prs.data.items;

        if (mergedReleasePRs.length > 0) {
            const pr = mergedReleasePRs[0]; // Assuming the first result is the match

            core.info(`Creating tag for ${lastCommitSHA}.`);
            const {data: tag} = await octokit.rest.git.createTag({
                owner,
                repo,
                tag: newVersion,
                message: `Tagging commit for PR #${pr.number}`,
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

            core.setOutput("pr-created", false);

            return;
        } else {
            core.info("No corresponding merged release pull request found.");
        }

        const releaseBranchExists = branches.some((branch) => branch.name === releaseBranch);
        if (releaseBranchExists) {
            core.info(`Branch "${releaseBranch}" already exists. Resetting "${releaseBranch}" to match "${targetBranch}"...`);
            await resetBranchToBranch(releaseBranch, targetBranch);
            core.info(`Branch "${releaseBranch}" has been reset to "${targetBranch}".`);
        } else {
            core.info(`Creating branch "${releaseBranch}" from "${targetBranch}"...`);
            await createBranch(releaseBranch, targetBranch);
            core.info(`Branch "${releaseBranch}" has been created from "${targetBranch}".`);
        }

        await updateChangelog(fileName, newVersion, prevVersion);

        await forcePush(releaseBranch);

        const {data: existingPrs} = await octokit.rest.pulls.list({
            owner: owner,
            repo: repo,
            head: `${owner}:${releaseBranch}`,
            base: targetBranch,
        });

        if (existingPrs.length === 0) {
            core.info(`Creating a new PR from "${releaseBranch}" to "${targetBranch}"...`);
            await octokit.rest.pulls.create({
                owner: owner,
                repo: repo,
                title: `PR to merge "${releaseBranch}" into ${targetBranch}`,
                head: releaseBranch,
                base: targetBranch,
                body: 'This PR contains release-related changes applied to the branch.',
            });
            core.info(`PR to merge "${releaseBranch}" into ${targetBranch} has been created.`);
            core.setOutput("pr-created", true);
        } else {
            core.setOutput("pr-created", false);
        }
        core.info(`Branch "${releaseBranch}" is now in sync with "${targetBranch}", and the PR is updated.`);
        core.setOutput("release-created", false);

    } catch (error: any) {
        core.error(error)
        core.setFailed(error.message);
    }
}

main()