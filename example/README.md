## How to Deploy
```sh
# Assume current direcotry is the example directory
cd ../src/lambda/nodejs-build
npm ci
npm run build
cd -
npx cdk deploy
```
