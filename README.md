# Multi platform implementation of web application

## MERN/MEAN/MEVN stack

- Mongo, Express, React, Node
- Mongo Express, Angular, Node (PWA)
- Mongo Express, Vue, Node

This project aims to implement similar UI in apps built in different JS architecture themes/styles as proofs of concepts/boilerplate/comparison points. While being fairly basic application at their hearts they demonstrate full CRUD operations built with good Auth/Security in mind and best practice in terms of handling data concurrently to a consistent UI with a good user experience.

## Framework Versions

- Angular 19
- React 19
- Vue 3.5.17
- Express 4.2.22
- Cypress 14

In terms of front end frameworks/libraries: Angular is more opinionated and comes with a full toolbox, React and Vue are more open to be using with your tools of choice for certain things - both have upsides and downsides depending on what you are doing with it

## Live Preview

For brevity/simplicty I have deployed instances of the site to servers so it can be live previewed.

- [API](https://api.demo.ndlbl.com/api/health)
- [Angular site](https://demo.ndlbl.com)
- [React site](https://react.demo.ndlbl.com)
- [Vue site](https://vue.ndlbl.com)

## Angular PWA

The Angular project in particular has been updated to show capabilities in Progressive web apps, utilising service workers and offline queues for CRUD items.

- Installable to phone homescreen, then viewable as a chromeless standalone application
- Offline/online aware
- Offline queueing for both task and library items
- Service workers for caching and app update loops

To test these features you can:

- Noticing the offline banner when disconnected from networks.
- Add tasks/library items after switching your online connection off (wifi/mobile network) then reconnecting and seeing the app live-sync those items when a connection is found again.
- Use add to homescreen from the demo url
- Viewing the app update snackbar/alert when app updates are available (this really depends on live updates being applied to the server, easily testable on your own deployments - trickeier to catch on the demo urls)

## Project Architecture

The mono-repo project contains 5 folders, 1 for each platform (Angular, React and Vue) one for the node.js Server with DB connections, Auth, and Email service, and one for Testing (e2e).

The API is a nodeJS server connecting to a mongoDB instance, the apps are both typescripted. The .env file are git-ignored, but .envExample is provided to share the Keys to which you need your own values - any final deploys will likely need the env key/pairs provided as env variables rather than the env files. Deploys for front ends are straight-up static file deploys.

Project

- API
- Angular App
- React App
- Vue App
- Tests

## Developer Experience

### Installation

Refer to your own OS's docs for install mongoDB, this should be running as a service in the background to be able to utilise the apps correctly.

Simply run `npm install` in the root folder to install all the package within this mono-repo

### Running apps

A 'run all' function is provided in the root package.json via `npm run dev` which concurrenelty starts the 2 front ends (`:4200` for angular, `:5173` for react and `5174` for vie) and the api, your local MongoDB instance should already be running.
Local mongoDB can run without auth (simply not providing `MONGO_USER` and `MONGO_PASS`) will use the non-authed DBs, never run a deployed API against a non-auth DB instance. front-ends both feature hot-reloads to instantly see changes you make.

### Linting

TS Linting happens both on save of files (providing VSCode) via script (`npm lint`/`npm lint:fix`) and just in case of different process or as a fallback it also happens as pre-commit hook via husky.

### Styling

I've used TailwindCSS here which I don't agree with as a long term solution (it's utility based and strong on 'class-itis') but have used as a trade-off for a faster launchpad - in the longer run and if this were commercial I would defer to a custom SCSS that is more succint as a whole and switch to a more semantic based style utilising either BEM or CUBE. While tailwind is very 'includes the kitchen sink' at least it compiles down to only including what you ahve used within your codebase.
[TailwindCSS docs](https://tailwindcss.com/docs/)

### Mail templating

Email based notification layouts rely unavoidably on a relativly antiquated way of doing things with inline style and limited functionality - to ease the process of design/build the node server allows you to preview the templates involved and pass them arguments as the data elements. This allows us to quickly and easily view design changes in browser befor live mail tests. We use nunjucks templates because they allow us to expand on a base and utilise shared partials. These are only available in dev environments and not exposed to prod deployments.

`/test/mails/{template name}?username=JoeBloggs&code=654321&email=joebloggs@mailexample.com`

current tamplates are:

- register
- login

### Commits

Commit against a ticket or job number in the commits description
When Merging provide screenshotted results of cypress e2e tests

## Server Side Rendering

Currently we render static pages as SSG/SSR and all authed routes are client side rendered, this is a tradeoff between ensuring marketing and allways-available pages are crawlable and indexable by search engines and simplicity for routes that render per-user anyway and would not be crawlable/indexable in any case.

## Testing

Currently we have e2e testing (via cypress) over both the apps (the same tests) and will add unit testing soon.
The angaulr app does contain some boilrplate spec files which are ready to be filled out as we move to that side of the work.

## Security

JWT tokens are used for user authication and roles authorisations.
Care is given to messaging within registration and login flows so as not to allow for mining of usernames/emails
Code requests are time gated (10 minute code active, 1 minute before code can be re-sent)

## Next steps

We'd like to expand the frameworks involved, namely (and obligatory) we should include Vue.js next, to round off the full 'big three' frameworks/libraries that are commercially and stanbdardly used across modern web devekopment.

For now I need to run an asccessibilty check across the board, and ensure our bases score high in lighthouse benchmarks tests.

UI/UX delights are missing and things are a bit clinical feeling as well as easily identifiable as a tailwind based app, a truly branded site would not want to allow this and while usability/UX _is good_, it needs polish and 'delight' touches to add character and a more overall professional feel.

In regards to security, we should be moving towards a smaller time window for JWTs with auto-refreshing flow - this allows for tighter admin control and mitigates risk of stolen tokens.

Implement CSRF form tokens for improved security.

Cool-down timer for OTP code resends

### Test Suite Expansions

We need to expand current testing to include unit tests over the modules for now I've used e2e as we get most bang for our buck seeing full end to end tests pass.
