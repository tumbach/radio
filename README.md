# Tumbach;Radio
#### frontend for [titleturtle](https://github.com/tumbach/titleturtle)

## Description
This app is designed as a simple online radio player.
It tries to follow OOP using its common patterns,
Frontend is lightweight and quite flexible.
Although it uses webpack, the output is native Javascript.

**Important: Since ES6 classes are used, they need to be [supported in the browser](https://caniuse.com/es6-class).**

## Prerequisites
- Node.js (LTS version or later)
- npm/yarn

## Installation

#### Clone and install dependencies
```shell script
git clone https://github.com/tumbach/radio
cd radio
npm i
```

#### Set NODE_ENV variable
 Set NODE_ENV for your shell
I could use `cross-env` but that's a little overhead!
Btw you can set it permanently in `/etc/environment`.

**Choose your destiny:**
```shell script
set NODE_ENV=production         # [Win] cmd
$env:NODE_ENV="production"      # [Win] powershell
export NODE_ENV=production      # [nix] *sh

npm run env NODE_ENV=production # [any] For npm 7+
```

#### Production build
```shell script
npm run build # or just `webpack` if you installed it globally
yarn build
```

#### Development and testing
```shell script
npm run start # or `webpack serve`
yarn start
```
