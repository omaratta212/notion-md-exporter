# Notion .md exporter (WORK-IN-PROGRESS)

A small node.js script to export nested notion.so pages into .md files

---
## Requirements

You will only need Node.js and a node global package, Yarn, installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###
### Yarn installation
  After installing node, this project will need yarn too, so just run the following command.

      $ npm install -g yarn

---

## Install

    $ https://github.com/omaratta212/notion-md-exporter.git
    $ cd notion-md-exporter
    $ yarn install

## Configure app

Copy `.env.example` file to `.env` then edit it with your settings. You will need:

- TOKEN_V2: Your notion.so auth token, you can get it from a cookie with the same name in any logged in notion client
- PARENT_PAGE_ID: The id appearing in the URL of the page you want to export it's children

## Running the project

    $ yarn start
