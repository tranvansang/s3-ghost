import * as S3 from 'aws-sdk/clients/s3'
import {Config as AWSConfig} from 'aws-sdk/lib/config'
import * as path from 'path'
import * as fs from 'fs'
import * as StorageBase from 'ghost-storage-base'
import {Handler} from 'express'
import {promisify} from 'util'

interface IS3GhostConfig {
	accessKeyId: string
	secretAccessKey: string
	bucketName: string
	region: string
	assetsBaseUrl: string
}

const serverPath = '../../../../core/server'

module.exports = class S3Ghost extends StorageBase {
	private readonly s3Instance: S3
	private readonly options: IS3GhostConfig
	private readonly storagePath: string

	constructor(config: IS3GhostConfig) {
		super()
		this.storagePath = require(`${serverPath}/config`).getContentPath('images')
		this.options = config
		const awsConfig = new AWSConfig({
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
			region: config.region
		})
		awsConfig.setPromisesDependency(Promise)
		this.s3Instance = new S3({
			apiVersion: '2006-03-01',
			params: {Bucket: config.bucketName},
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
			region: config.region
		})
		this.s3Instance.config = awsConfig
	}

	getAWSKey(targetFileName: string){
		return path.relative(this.storagePath, targetFileName)
	}

	async exists(fileName: string, targetDir?: string): Promise<boolean> {
		targetDir = targetDir || super.getTargetDir(this.storagePath)
		const targetFileName = path.join(targetDir, fileName)
		try {
			await this.s3Instance.headObject({
				Key: this.getAWSKey(targetFileName),
				Bucket: this.options.bucketName
			}).promise()
			return true
		} catch (e) {
			return false
		}
	}

	async save(image: StorageBase.Image, targetDir?: string): Promise<string> {
		targetDir = targetDir || super.getTargetDir(this.storagePath)
		const targetFileName = await super.getUniqueFileName(image, targetDir)
		await this.s3Instance.putObject({
			ContentType: image.type,
			Key: this.getAWSKey(targetFileName),
			Body: await promisify(fs.readFile.bind(fs))(image.path),
			Bucket: this.options.bucketName
		}).promise()
		const urlUtils = require(`${serverPath}/lib/url-utils`)
		return urlUtils.urlJoin(
				'/',
				urlUtils.getSubdir(),
				urlUtils.STATIC_IMAGE_URL_PREFIX,
				path.relative(this.storagePath, targetFileName)
		).replace(new RegExp(`\\${path.sep}`, 'g'), '/')
	}

	serve(): Handler {
		return (req, res) => {
			res
					.status(301)
					.redirect(`${this.options.assetsBaseUrl}${req.url.replace(/\/$/, '')}`)
		}
	}

	async delete(fileName: string, targetDir?: string): Promise<boolean> {
		targetDir = targetDir || super.getTargetDir(this.storagePath)
		const targetFileName = path.join(targetDir, fileName)
		try {
			await this.s3Instance.deleteObject({
				Key: this.getAWSKey(targetFileName),
				Bucket: this.options.bucketName
			}).promise()
			return true
		} catch (e) {
			return false
		}
	}

	async read(options?: StorageBase.ReadOptions): Promise<Buffer> {
		const targetPath = path.join(
				this.storagePath,
				// remove trailing slashes
				(options && options.path || '').replace(/\/$|\\$/, '')
		)
		const response = await this.s3Instance.getObject({
			Key: targetPath,
			Bucket: this.options.bucketName
		}).promise()
		return response.Body as Buffer
	}
}
