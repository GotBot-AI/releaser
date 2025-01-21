import {execFileAsync} from "./execute";

export async function setupLocalUser() {
    await execFileAsync("git", ["config", "--local", "user.email", "action@github.com"]);
    await execFileAsync("git", ["config", "--local", "user.name", "GitHub Action"]);
}