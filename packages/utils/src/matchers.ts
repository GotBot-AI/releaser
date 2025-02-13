export const defaultBreakingChangeCommitMatchers = ["BREAKING CHANGE"]
export const defaultFeatureCommitMatchers = [
    "^feature/[a-zA-Z0-9 -]+:",
    "^\\* feature/[a-zA-Z0-9 -]+:",
    "^feat/[a-zA-Z0-9 -]+:",
    "\\* ^feat/[a-zA-Z0-9 -]+:",
];
export const defaultBugfixCommitMatchers = [
    "^feature/[a-zA-Z0-9 -]+ (PATCH):",
    "^\\* feature/[a-zA-Z0-9 -]+ (PATCH):",
    "^bugfix/[a-zA-Z0-9 -]+:",
    "^\\* bugfix/[a-zA-Z0-9 -]+:",
    "^fix/[a-zA-Z0-9 -]+:",
    "^\\* fix/[a-zA-Z0-9 -]+:",
    "^(PATCH)",
    "^\\* (PATCH)",
];

