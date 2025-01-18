import execAsync from "./execute";

export async function setupLocalUser() {
    await execAsync(`git config --local user.email "action@github.com"`);
    await execAsync(`git config --local user.name "GitHub Action"`);
}