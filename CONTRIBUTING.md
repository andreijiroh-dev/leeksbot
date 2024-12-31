# Contributing to the project

Thank you for your interest in contributing into the project!

## Preflight Checklist

* [ ] Read and understand the project's [code of conduct](./CODE_OF_CONDUCT.md)
* [ ] Agree to the [Developer's Certificate of Origin](https://developercertificate.org/) (We don't do CLAs here to minimize legal admin headaches with the HCB team.)
* [ ] For Hack Clubbers, join the `#leeksbot-meta` (app dev and project meta discusions) and the main `#hackclub-leeks` channel.

### Requirements

You can use Nix via our `devenv.nix` configuration (see <https://devenv.sh/install> for
the installation guide).

Alternatively, you can manually set up your development environment with the following

* Node.js 20.x or later - When using `nvm` or `asdf`, please use the even-numbered LTS versions
(if the latest version is even-numbered,wait until the official LTS announcement)
when testing and contributing code.
* Postgres 14+ - You can run a Dockerized Postgres server or use Nest Postgres for that.
To use `prisma migrate` commands, you need two databases, one for data persistence and another for migrations.

## Running a local dev instance

1. Ask @ajhalili2006 for the `DOTENV_PRIVATE_KEY` to decrypt the dev secrets via `dotenvx`.
    * Alternatively, reset everything by blanking the contents of `.env.development` (without commiting
    on your personal
    branch/fork to avoid conflicts) and configure your own secrets via `dotenvx set`
2. Install dependencies: `npm i`
3. Run local instance with hot-reloading via `ts-node-dev`: `npm run dev`

## Sending patches

The instructions on sending patches for the project use the command line way
to keep your hands on the keyboard when using VS Code for the terminal.

If you are editing in VS Code, we have `git.alwaysSignOff` set to `true` to automatically sign-off your commits
(this is different from using your GPG/SSH key to sign commits for authenticity).
When editing on terminal, add `--signoff` flag to your `git commit` command.

### GitLab

This project is canonically hosted on [Manimun GitLab instance] by [Tulir Asokan]
but you can sign in using GitHub and GitLab SaaS to sign up (otherwise you might need
to contact him directly if you want to sign up via email due to spam).

1. Authenicate with [GitLab CLI]: `glab auth login -h mau.dev`
2. Work on your feature request or bugfix on a seperate branch.
3. Push often to your personal branch/fork to ensure you don't lose anything when
switch between machines.
4. Once ready, just run `glab mr create -R https://mau.dev/andreijiroh-dev/leeksbot -b main`
and follow prompts.

[GitLab CLI]: https://gitlab.com/gitlab-org/cli
[Manimun GitLab instance]: https://mau.dev/andreijiroh-dev/leeksbot
[Tulir Asokan]: https://github.com/tulir

### GitHub

Although we use GitLab as our development hub, we're still accepting merge requests through the GitHub mirror.

1. Authenicate with [GitHub CLI]: `gh auth login`
2. Work on your feature request or bugfix on a seperate branch.
3. Push often to your personal branch/fork to ensure you don't lose anything when
switch between machines.

[GitHub CLI]: https://cli.github.com

### sourcehut

If you prefer to send patches via email, please do not send it to Andrei Jiroh
or other project maintainers directly (not even attaching the patch files
on Slack).

More details on how to send email patches will be added soon.
