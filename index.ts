import path from 'node:path'
import fs from 'node:fs'
import StorageBase from 'ghost-storage-base'
import type {Handler} from 'express'
import {promisify} from 'node:util'
import ms from 'ms'
import {DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {sanitizeS3Key} from 's3-key'
import 'core-js/features/string/replace-all'
import type {Readable} from 'node:stream'

interface IS3GhostConfig {
	ghostDirectory: string

	accessKeyId: string
	secretAccessKey: string
	bucketName: string
	region: string
	endpoint: string // https://sgp1.digitaloceanspaces.com
	baseDir?: string // example: foo/bar/
	assetsBaseUrl: string // example: https://cdn.example.com without baseDir
}

const streamToBuffer = (stream: Readable) => new Promise<Buffer>((resolve, reject) => {
	const chunks = []
	stream.on('data', (chunk) => chunks.push(chunk))
	stream.once('end', () => resolve(Buffer.concat(chunks)))
	stream.once('error', reject)
})


module.exports = class S3Ghost extends StorageBase {
	private readonly s3Instance: S3Client
	private readonly options: IS3GhostConfig
	private readonly storagePath: string

	constructor(config: IS3GhostConfig) {
		super()
		// https://github.com/TryGhost/Ghost/blob/592d02fd23a3a440f0be06d8f8cdce18a4ec3742/core/shared/config/helpers.js#L69
		// images or files or media or public
		// in old version: only support images
		this.storagePath = require(`${config.ghostDirectory}/core/shared/config`).getContentPath('images')
		this.options = config

		this.s3Instance = new S3Client({
			apiVersion: '2006-03-01',
			endpoint: config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			}
		})
	}

	async exists(fileName: string, targetDir): Promise<boolean> {
		try {
			await this.s3Instance
				.send(new HeadObjectCommand({
					Key: this.getAWSKey(path.join(targetDir, fileName)),
					Bucket: this.options.bucketName,
				}))
			return true

		} catch (e) {
			return false
		}
	}

	async save(file: StorageBase.Image, targetDir?: string): Promise<string> {
		// typing package is incorrect, the method indeed returns a promise
		const absPath = await super.getUniqueFileName(file, targetDir || super.getTargetDir(this.storagePath))
		const s3Key = this.getAWSKey(absPath)

		await this.s3Instance
			.send(
				new PutObjectCommand({
					Key: s3Key,
					Body: await promisify(fs.readFile.bind(fs))(file.path),
					ContentType: file.type,
					CacheControl: `public, max-age=${Math.round(ms('3 weeks') / ms('1 second'))}`,
					Bucket: this.options.bucketName,
					ACL: 'public-read',
				})
			)
		return this.pathToUrl(absPath)
	}

	serve(): Handler {
		return (req, res) => {
			res
					.status(301)
					.redirect(`${this.options.assetsBaseUrl || `https://${this.options.bucketName}.s3.${this.options.region}.amazonaws.com`}/${this.options.baseDir || ''}${req.url.replace(/\/$/, '').replace(/^\//, '')}`)
		}
	}

	async delete(fileName: string, targetDir?: string): Promise<boolean> {
		try {
			await this.s3Instance
				.send(new DeleteObjectCommand({
					Key: this.getAWSKey(path.join(targetDir || this.storagePath, fileName)),
					Bucket: this.options.bucketName,
				}))

			return true
		} catch (e) {
			return false
		}
	}

	async read(options?: StorageBase.ReadOptions): Promise<Buffer> {
		// remove trailing/leading slashes
		const targetPath = (options && options.path || '').replace(/\/$|\\$/, '').replace(/^\//, '')
		const s3Key = this.getAWSKey(path.join(this.storagePath, targetPath))

		const response = await this.s3Instance
			.send(new GetObjectCommand({
				Key: s3Key,
				Bucket: this.options.bucketName,
			}))
		return await streamToBuffer(response.Body as Readable)
	}

	private getAWSKey(absPath: string) {
		const relativePath = path.relative(this.storagePath, absPath)
		if (relativePath.startsWith('..')) throw new Error('do not support upload outside of storagePath')
		return sanitizeS3Key(`${this.options.baseDir || ''}${relativePath}`)
	}

	private pathToUrl(absPath: string) {
		const urlUtils = require(`${this.options.ghostDirectory}/core/shared/url-utils`)
		return urlUtils.urlJoin(
			'/',
			urlUtils.getSubdir(),
			urlUtils.STATIC_IMAGE_URL_PREFIX,
			path.relative(this.storagePath, absPath)
		).replace(new RegExp(`\\${path.sep}`, 'g'), '/')
	}
}
