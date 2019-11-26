# S3 Ghost
Ghost AWS S3 Storage Adapter

# How to
From your parent directory of the `content` directory (ghost root by default). Run following script
```bash
rm -rf content/adapters/storage/s3-ghost
mkdir content/adapters/storage/s3-ghost
cd content/adapters/storage/s3-ghost
yarn init -y
yarn add s3-ghost
cp node_modules/s3-ghost/index.js .
rm -rf node_modules/s3-ghost package.json yarn.lock
```
- In `config.production.json` add configuration as follows. All keys are required
```
    "storage": {
        "active": "s3-ghost",
        "s3-ghost": {
            "accessKeyId": "<AWS key>",
            "secretAccessKey": "<AWS Secret key>",
            "bucketName": "<bucket name>",
            "region": "<region>",
            "assetsBaseUrl": "<CDN url or s3 url>"
        }
```
