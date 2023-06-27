# Fnordcredit [![Travis badge](https://travis-ci.org/fnordcredit/fnordcredit.svg?branch=master)](https://travis-ci.org/fnordcredit/fnordcredit)
Open source credit system

Innovative, easy to use credit system for multiple users that comes with an intuitive design: Create an account and charge or discharge your credit.

Fnordcredit is written in Typescript/Next.js/tailwindcss/prisma.

# Set up
To start a local development server do the following:

```sh
git clone git@github.com:fnordcredit/fnordcredit.git
cd fnordcredit
yarn
cp .env.example .env
yarn newDatabase
yarn build
```

As last step, start the local development server using ```yarn start``` and visit http://localhost:8000

# Updating Fnordcredit

```sh
git pull
yarn
yarn knex migrate:latest
yarn build
yarn start
```
