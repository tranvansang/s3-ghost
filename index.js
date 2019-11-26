"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var S3 = require("aws-sdk/clients/s3");
var config_1 = require("aws-sdk/lib/config");
var path = require("path");
var fs = require("fs");
var StorageBase = require("ghost-storage-base");
var util_1 = require("util");
var serverPath = '../../../../core/server';
module.exports = /** @class */ (function (_super) {
    __extends(S3Ghost, _super);
    function S3Ghost(config) {
        var _this = _super.call(this) || this;
        _this.storagePath = require(serverPath + "/config").getContentPath('images');
        _this.options = config;
        var awsConfig = new config_1.Config({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region
        });
        awsConfig.setPromisesDependency(Promise);
        _this.s3Instance = new S3({
            apiVersion: '2006-03-01',
            params: { Bucket: config.bucketName },
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region
        });
        _this.s3Instance.config = awsConfig;
        return _this;
    }
    S3Ghost.prototype.getAWSKey = function (targetFileName) {
        return path.relative(this.storagePath, targetFileName);
    };
    S3Ghost.prototype.exists = function (fileName, targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var targetFileName, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetDir = targetDir || _super.prototype.getTargetDir.call(this, this.storagePath);
                        targetFileName = path.join(targetDir, fileName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.s3Instance.headObject({
                                Key: this.getAWSKey(targetFileName),
                                Bucket: this.options.bucketName
                            }).promise()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    S3Ghost.prototype.save = function (image, targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var targetFileName, _a, _b, _c, urlUtils;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        targetDir = targetDir || _super.prototype.getTargetDir.call(this, this.storagePath);
                        return [4 /*yield*/, _super.prototype.getUniqueFileName.call(this, image, targetDir)];
                    case 1:
                        targetFileName = _d.sent();
                        _b = (_a = this.s3Instance).putObject;
                        _c = {
                            ContentType: image.type,
                            Key: this.getAWSKey(targetFileName)
                        };
                        return [4 /*yield*/, util_1.promisify(fs.readFile.bind(fs))(image.path)];
                    case 2: return [4 /*yield*/, _b.apply(_a, [(_c.Body = _d.sent(),
                                _c.Bucket = this.options.bucketName,
                                _c)]).promise()];
                    case 3:
                        _d.sent();
                        urlUtils = require(serverPath + "/lib/url-utils");
                        return [2 /*return*/, urlUtils.urlJoin('/', urlUtils.getSubdir(), urlUtils.STATIC_IMAGE_URL_PREFIX, path.relative(this.storagePath, targetFileName)).replace(new RegExp("\\" + path.sep, 'g'), '/')];
                }
            });
        });
    };
    S3Ghost.prototype.serve = function () {
        var _this = this;
        return function (req, res) {
            res
                .status(301)
                .redirect("" + _this.options.assetsBaseUrl + req.url.replace(/\/$/, ''));
        };
    };
    S3Ghost.prototype["delete"] = function (fileName, targetDir) {
        return __awaiter(this, void 0, void 0, function () {
            var targetFileName, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetDir = targetDir || _super.prototype.getTargetDir.call(this, this.storagePath);
                        targetFileName = path.join(targetDir, fileName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.s3Instance.deleteObject({
                                Key: this.getAWSKey(targetFileName),
                                Bucket: this.options.bucketName
                            }).promise()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        e_2 = _a.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    S3Ghost.prototype.read = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var targetPath, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetPath = path.join(this.storagePath, 
                        // remove trailing slashes
                        (options && options.path || '').replace(/\/$|\\$/, ''));
                        return [4 /*yield*/, this.s3Instance.getObject({
                                Key: targetPath,
                                Bucket: this.options.bucketName
                            }).promise()];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.Body];
                }
            });
        });
    };
    return S3Ghost;
}(StorageBase));
