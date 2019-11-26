# S3 Ghost
Ghost AWS S3 Storage Adapter

# How to
- `yarn add s3-ghost`
- Copy `node_modules/s3-ghost s3-ghost.js` to `content/adapters/storage/s3-ghost.js`
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
