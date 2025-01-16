import * as fs from "fs";
import * as changelog from '../../src/utils/changelog';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('changelog.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('creates a changelog file if it does not exist', () => {
        jest.mocked(fs.existsSync).mockReturnValue(false);
        jest.mocked(fs.writeFileSync).mockImplementation(() => {
        });

        changelog.updateChangelog("CHANGELOG.md", "v1.1.0", "v1.0.0");

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            'CHANGELOG.md',
            ""
        );
    });

    test('does not create a changelog file if it already exists', () => {
        jest.mocked(fs.existsSync).mockReturnValue(true);

        changelog.updateChangelog("CHANGELOG.md", "v1.1.0", "v1.0.0");

        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('updates the changelog with the new version', () => {
        jest.mocked(fs.readFileSync).mockImplementation(() => '## [v1.2.3] - 2024-12-31\n\n- fix: fix a bug\n');
        jest.mocked(fs.writeFileSync).mockImplementation(() => {
        });

        changelog.changelog(
            'v1.3.0',
            '2025-01-16',
            '- feat: add new feature\n- fix: fix a bug',
            'CHANGELOG.md'
        );

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            'CHANGELOG.md',
            '## [v1.3.0] - 2025-01-16\n- feat: add new feature\n- fix: fix a bug\n\n## [v1.2.3] - 2024-12-31\n\n- fix: fix a bug\n'
        );
    });

    test('removes existing changelog entries for the version before adding a new one', () => {
        jest.mocked(fs.readFileSync).mockImplementation(() =>
            '## [v1.3.0] - 2025-01-16\n- feat: add new feature\n- fix: fix a bug\n\n## [v1.2.3] - 2024-12-31\n\n- fix: fix a bug\n'
        );
        jest.mocked(fs.writeFileSync).mockImplementation(() => {
        });

        changelog.changelog(
            'v1.3.0',
            '2025-01-16',
            '- feat: add new feature\n- fix: fix a bug',
            'CHANGELOG.md'
        );

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            'CHANGELOG.md',
            '## [v1.3.0] - 2025-01-16\n- feat: add new feature\n- fix: fix a bug\n\n## [v1.2.3] - 2024-12-31\n\n- fix: fix a bug\n'
        );
    });
});
