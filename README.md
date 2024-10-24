# Hack Club Leeks Slack app

[![Hack Club](https://badges.api.lorebooks.wiki/badges/hackclub/hackclub?style=flat-square)](https://hackclub.com/slack)

A Slack app for flagging leeks around the Hack Club Slack, with a review queue
to prevent abuse and false postives. Proudly hosted on [Nest](https://hackclub.app).

**CALLING FOR CONTRIBUTIONS AND MAINTAINERS**: This project is currently a one-man operation and needs your help to keep it maintained. Learn more in the project's
[contributing guidelines](./CONTRIBUTING.md) If you can't support the project by contributing patches and bug reports,
consider [sponsoring Andrei Jiroh's work](https://sponsors.andreijiroh.dev) or [help Hack Club Nest admins pay the biils](https://hcb.hackclub.com/donations/start/nest)[^1].

## Context for non-Hack Clubbers

The term `leek` is used among Hack Clubbers to say that they spotted
something being cooked on from the HQ without any announcement whatsoever.
In short, a leak (minus any PII nightmares). For the original usage of the term, cue from [Wikipedia](https://en.wikipedia.org/wiki/Leek):

> A leek is a vegetable, a cultivar of Allium ampeloprasum, the broadleaf wild leek (syn. Allium porrum). The edible part of the plant is a bundle of leaf sheaths that is sometimes erroneously called a stem or stalk.

In the [What Hack Club is not](https://hackclub.slack.com/files/UDK5M9Y13/F072YGU6A9Z/what_hack_club_is_not.pdf) document by Chris Walker of Hack Club HQ:

> **Hack Club is not absolutely transparent**
>
> Hack Club is radically transparent in many ways, but not all information is shared with all parties at all
>times. Most of our code is open source, but not all of it. We aspire to be transparent about
> moderation decisions in the Slack, but sometimes details are not released (such as to preserve the
> privacy or dignity of members). Events or initiatives may involve elements of secrecy (usually because
> surprises are fun). If you want to know something but it hasn't been made public, ask about it; you
> aren't *guaranteed* an answer, but frequently information is not shared simply because it is impractical
> to put every possible thing out in the open.

The channel `#hackclub-leeks` was created October 9th, 2023 by `[PERSON SHALL NOT BE NAMED]`[^2], initially called `#hc-site-tracker` and renamed many times in the past to track changes in Hack Club site (and the `hackclub.dev` domain)
with help of other data sleuths at Hack Club. Fast forward to this day, the channel has been used to get a sneak peek into upcoming events that the HQ been cooking
(even some staff sharing them).

The bot development started as a simple Slack workflow made by Andrei Jiroh (Hack Clubber since Arcade 2024 and SABDFL at RecapTime.dev) by sending a link to
a possible leek when reacting with `leek[s]` emoji in selected channels. It is then evolved into the bot in its current form, with added feature
of review queues to ensure nothing go wrong and to avoid troubles with the HQ.

## Features

- Review queues for the bot admins to avoid false positives, similar to Prox2.
- React with :leeks: or use the `Flag as leek` message action.
- Utility slash commands to track status and to speed up moderation actions for reviewers.

## Privacy Policy

We only log your Slack user ID in a Postgres database hosted on Hack Club Nest for moderation
efforts and to get notified about the status of your flagged leek. The bot admins (called Leeks
Bot Review Queue team in Hack Club Slack) may reach you out via DMs to validate your flag or
if any moderation actions were taken.

In case of abuse, you may be banned from using the bot and may be reported to the Fire
Department if found breaking [the Hack Club Code of Conduct](./CODE_OF_CONDUCT.md).

## License

- Code: MPL-2.0
- Documentation at `./docs`: CC-BY-SA-4.0

[^1]: [Nest](https://hackclub.app) is a HQ-funded project and part of [the tildeverse](https://tildeverse.org). Although Hack Club funds the tilde to pay for the dedicated Linux server on Hetzer from donors, please note that the admins are unpaid volunteers and maintain it on their own time.
[^2]: We wish we could say Reese Armstrong's name uncensored, but due to [an current active community ban (as of October 21, 2024)](https://hackmd.io/@alexjs/Bkm1KIpxR) we had to do unnecessary censorship here to avoid being "hit by a bus" when mentioning banned people. Those reading about the [WIP blog post](https://gildedguy.com/working-on-dragon-anim#:~:text=Some%20time%20ago%2C%20Mar%E2%80%99s%20creator%20found%20himself%20in%20a%20whirlwind%20of%20controversy%20and%20disappeared%20from%20the%20net%20without%20explanation%2C%20or%20any%20attempt%20to%20justify%20himself.)
for [Gildedguy Story 8](https://gildedguy.com/gildedguy-the-dragon-of-mar-is-out-in-the-wild) might also familiar with the whole Barthimo1 situtation (which we'll not discuss in detail here).
