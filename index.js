"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ghost_storage_base_1 = __importDefault(require("ghost-storage-base"));
const util_1 = require("util");
const serverPath = '../../../../core/server';
module.exports = class S3Ghost extends ghost_storage_base_1.default {
    constructor(config) {
        super();
        this.storagePath = require(`${serverPath}/config`).getContentPath('images');
        this.options = config;
        const awsConfig = new aws_sdk_1.Config({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region
        });
        awsConfig.setPromisesDependency(Promise);
        this.s3Instance = new aws_sdk_1.S3({
            apiVersion: '2006-03-01',
            params: { Bucket: config.bucketName },
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region
        });
        this.s3Instance.config = awsConfig;
    }
    getAWSKey(targetFileName) {
        return path_1.default.relative(this.storagePath, targetFileName);
    }
    exists(fileName, targetDir) {
        const _super = Object.create(null, {
            getTargetDir: { get: () => super.getTargetDir }
        });
        return __awaiter(this, void 0, void 0, function* () {
            targetDir = targetDir || _super.getTargetDir.call(this, this.storagePath);
            const targetFileName = path_1.default.join(targetDir, fileName);
            try {
                yield this.s3Instance.headObject({
                    Key: this.getAWSKey(targetFileName),
                    Bucket: this.options.bucketName
                }).promise();
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    save(image, targetDir) {
        const _super = Object.create(null, {
            getTargetDir: { get: () => super.getTargetDir },
            getUniqueFileName: { get: () => super.getUniqueFileName }
        });
        return __awaiter(this, void 0, void 0, function* () {
            targetDir = targetDir || _super.getTargetDir.call(this, this.storagePath);
            const targetFileName = yield _super.getUniqueFileName.call(this, image, targetDir);
            yield this.s3Instance.putObject({
                ContentType: image.type,
                Key: this.getAWSKey(targetFileName),
                Body: yield util_1.promisify(fs_1.default.readFile.bind(fs_1.default))(image.path),
                Bucket: this.options.bucketName
            }).promise();
            const urlUtils = require(`${serverPath}/lib/url-utils`);
            return urlUtils.urlJoin('/', urlUtils.getSubdir(), urlUtils.STATIC_IMAGE_URL_PREFIX, path_1.default.relative(this.storagePath, targetFileName)).replace(new RegExp(`\\${path_1.default.sep}`, 'g'), '/');
        });
    }
    serve() {
        return (req, res) => {
            res
                .status(301)
                .redirect(`${this.options.assetsBaseUrl}${req.url.replace(/\/$/, '')}`);
        };
    }
    delete(fileName, targetDir) {
        const _super = Object.create(null, {
            getTargetDir: { get: () => super.getTargetDir }
        });
        return __awaiter(this, void 0, void 0, function* () {
            targetDir = targetDir || _super.getTargetDir.call(this, this.storagePath);
            const targetFileName = path_1.default.join(targetDir, fileName);
            try {
                yield this.s3Instance.deleteObject({
                    Key: this.getAWSKey(targetFileName),
                    Bucket: this.options.bucketName
                }).promise();
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    read(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetPath = path_1.default.join(this.storagePath, 
            // remove trailing slashes
            (options && options.path || '').replace(/\/$|\\$/, ''));
            const response = yield this.s3Instance.getObject({
                Key: targetPath,
                Bucket: this.options.bucketName
            }).promise();
            return response.Body;
        });
    }
};
