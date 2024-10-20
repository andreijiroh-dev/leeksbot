# Contributing to the project

## Preflight Checklist

* [ ] Read and understand the [code of conduct](./CODE_OF_CONDUCT.md)
* [ ] Agree to the [Developer's Certificate of Origin](https://developercertificate.org/) (We don't do CLAs here to minimize legal admin headaches with HCB.)
* [ ] For Hack Clubbers, join the `#leeksbot` (app dev and project meta discusions) and `#hackclub-leeks` channel.

### Requirements

* Node.js 20.x or later - When using `nvm` or `asdf`, please use the even-numbered LTS versions
(if the latest version is even-numbered,wait until the official LTS announcement)
when testing and contributing code.
* Postgres 14+ - You can run a Dockerized Postgres server or use Nest Postgres for that.
To use `prisma migrate` commands, you need two databases, one for data persistence and another for migrations.

## Sending patches

The instructions on sending patches for the project use the command line way
to keep your hands on the keyboard when using VS Code for the terminal.

### GitLab

This project is canonically hosted on [Manimun GitLab instance] by [Tulir Asokan]
but you can sign in using GitHub and GitLab SaaS to create one.

1. Authenicate with [GitLab CLI]: `glab auth login -h mau.dev`
2. Work on your feature request or bugfix on a seperate branch.
3. Push often to your personal branch/fork to ensure you don't lose anything when
switch between machines.
4. Once ready, just run `glab mr create -R https://mau.dev/andreijiroh-dev/leeksbot -b main`
and follow prompts

[GitLab CLI]: https://gitlab.com/gitlab-org/cli
[Manimun GitLab instance]: https://mau.dev/andreijiroh-dev/leeksbot
[Tulir Asokan]: https://github.com/tulir

### GitHub

Although

1. Authenicate with [GitHub CLI]: `gh auth login`
2. Work on your feature request or bugfix on a seperate branch.
3. Push often to your personal branch/fork to ensure you don't lose anything when
switch between machines.

[GitHub CLI]: https://cli.github.com

### sourcehut

If you prefer to send patches via email, please do not send it to Andrei Jiroh
or other project maintainers directly.

TBD
