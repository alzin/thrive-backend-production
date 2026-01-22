import AWS from 'aws-sdk';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ENV_CONFIG } from '../config/env.config';

export class S3StorageService {
    private s3: AWS.S3;
    private bucketName: string;

    constructor() {
        const awsConfig = {
            accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
            secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
            region: ENV_CONFIG.AWS_REGION || 'us-east-1',
            signatureVersion: 'v4',
        };

        AWS.config.update(awsConfig);

        this.s3 = new AWS.S3({
            ...awsConfig,
            s3ForcePathStyle: false,
        });

        this.bucketName = ENV_CONFIG.AWS_S3_BUCKET_NAME!;

        if (!this.bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
        }

    }


    private sanitizeFilename(originalName: string): string {

        try {
            // First try to decode if it's URL encoded
            let decoded = originalName;
            try {
                decoded = decodeURIComponent(originalName);
            } catch (e) {
                // If decoding fails, use original
                decoded = originalName;
            }

            // Convert from buffer encoding issues (Arabic text)
            let sanitized = decoded;

            // If we have encoding issues, create a safe filename
            if (sanitized.includes('Ø') || sanitized.includes('\\x')) {
                const ext = path.extname(originalName).toLowerCase();
                const timestamp = Date.now();
                const uuid = uuidv4().substring(0, 8);
                sanitized = `media_${timestamp}_${uuid}${ext || '.mp4'}`;
            } else {
                // Normal sanitization for regular filenames
                sanitized = sanitized
                    .normalize('NFD') // Decompose accented characters
                    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                    .replace(/[^\w\s.-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_') // Replace spaces with underscores
                    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
                    .toLowerCase() // Convert to lowercase
                    .substring(0, 100); // Limit length
            }

            // Ensure we have a valid extension
            if (!path.extname(sanitized)) {
                const originalExt = path.extname(originalName);
                if (originalExt) {
                    sanitized += originalExt.toLowerCase();
                } else {
                    sanitized += '.bin'; // Default extension
                }
            }

            return sanitized;

        } catch (error) {
            console.error('Error sanitizing filename:', error);
            // Fallback to timestamp-based name
            const ext = path.extname(originalName).toLowerCase() || '.bin';
            return `media_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
        }
    }

    /**
     * Generate unique filename for S3
     */
    private generateUniqueFilename(originalName: string, userId: string): string {
        const sanitizedName = this.sanitizeFilename(originalName);
        const ext = path.extname(sanitizedName);
        const nameWithoutExt = path.basename(sanitizedName, ext);
        const timestamp = Date.now();
        const uuid = uuidv4().substring(0, 8);

        return `${nameWithoutExt}_${timestamp}_${uuid}${ext}`;
    }

    /**
     * Generate unique profile photo filename
     */
    private generateProfilePhotoFilename(userId: string, mimeType: string): string {
        const extension = mimeType.split('/')[1] || 'jpg';
        const timestamp = Date.now();
        const uuid = uuidv4().substring(0, 8);

        return `profile_${userId}_${timestamp}_${uuid}.${extension}`;
    }

    /**
     * Validate community media file
     */
    static validateCommunityMediaFile(file: Express.Multer.File): void {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const maxImageSize = 10 * 1024 * 1024; // 10MB
        const maxVideoSize = 100 * 1024 * 1024; // 100MB
        const maxSize = file.mimetype.startsWith('image/') ? maxImageSize : maxVideoSize;

        if (file.size > maxSize) {
            const maxSizeLabel = file.mimetype.startsWith('image/') ? '10MB' : '100MB';
            throw new Error(`File size exceeds ${maxSizeLabel}. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Upload profile photo
     */
    async uploadProfilePhoto(
        userId: string,
        fileBuffer: Buffer,
        mimeType: string
    ): Promise<string> {
        try {

            // Validate inputs
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!fileBuffer || fileBuffer.length === 0) {
                throw new Error('Empty file buffer');
            }

            // Validate file type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedMimeTypes.includes(mimeType)) {
                throw new Error(`Invalid file type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`);
            }

            // Validate file size (5MB max for profile photos)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (fileBuffer.length > maxSize) {
                throw new Error(`File size exceeds 5MB limit. Current size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            }

            // Generate safe filename
            const safeFilename = this.generateProfilePhotoFilename(userId, mimeType);

            // Create S3 key with folder structure
            const key = `profiles/${userId}/${safeFilename}`;

            // Prepare upload parameters
            const uploadParams: AWS.S3.PutObjectRequest = {
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
                ContentDisposition: `inline; filename="${safeFilename}"`,
                CacheControl: 'public, max-age=31536000', // 1 year cache
                // ACL: 'public-read', // Make file publicly accessible
                Metadata: {
                    'uploaded-by': userId,
                    'file-type': 'profile-photo',
                    'upload-timestamp': Date.now().toString(),
                    'file-size': fileBuffer.length.toString()
                }
            };

            // Perform S3 upload
            const result = await this.s3.upload(uploadParams).promise();


            return result.Location;

        } catch (error: any) {
            console.error('❌ Profile Photo Upload Error Details:');
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Status code:', error.statusCode);

            // Provide specific error messages based on error codes
            let errorMessage = `Failed to upload profile photo: ${error.message}`;

            switch (error.code) {
                case 'SignatureDoesNotMatch':
                    errorMessage = 'AWS credentials are invalid or expired. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
                    break;
                case 'NoSuchBucket':
                    errorMessage = `S3 bucket "${this.bucketName}" does not exist or is not accessible.`;
                    break;
                case 'AccessDenied':
                    errorMessage = 'Access denied. Please check your AWS IAM permissions for S3 operations.';
                    break;
                case 'InvalidAccessKeyId':
                    errorMessage = 'Invalid AWS Access Key ID. Please verify your credentials.';
                    break;
                default:
                    break;
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Delete old profile photo
     */
    async deleteOldProfilePhoto(photoUrl: string): Promise<void> {
        try {
            if (!photoUrl) {
                return;
            }
            // Extract key from URL
            const url = new URL(photoUrl);
            const key = url.pathname.substring(1); // Remove leading slash


            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();

        } catch (error: any) {
            console.error('❌ Delete old profile photo error:', error);
            throw new Error(`Failed to delete old profile photo: ${error.message}`);
        }
    }

    /**
     * Upload single community media file
     */
    async uploadCommunityMedia(
        userId: string,
        fileData: { buffer: Buffer; filename: string; mimeType: string }
    ): Promise<{ url: string; size: number; mimeType: string }> {
        try {

            // Validate inputs
            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!fileData.buffer || fileData.buffer.length === 0) {
                throw new Error('Empty file buffer');
            }

            if (!fileData.filename) {
                throw new Error('Filename is required');
            }

            // Generate safe filename
            const safeFilename = this.generateUniqueFilename(fileData.filename, userId);

            // Create S3 key with folder structure
            const key = `community/${userId}/${safeFilename}`;

            // Prepare upload parameters
            const uploadParams: AWS.S3.PutObjectRequest = {
                Bucket: this.bucketName,
                Key: key,
                Body: fileData.buffer,
                ContentType: fileData.mimeType,
                ContentDisposition: `inline; filename="${safeFilename}"`,
                CacheControl: 'public, max-age=31536000', // 1 year cache
                // ACL: 'public-read', // Make file publicly accessible
                Metadata: {
                    'uploaded-by': userId,
                    'original-filename': this.sanitizeFilename(fileData.filename),
                    'upload-timestamp': Date.now().toString(),
                    'file-size': fileData.buffer.length.toString()
                }
            };

            // Perform S3 upload
            const result = await this.s3.upload(uploadParams).promise();

            return {
                url: result.Location,
                size: fileData.buffer.length,
                mimeType: fileData.mimeType,
            };

        } catch (error: any) {

            // Provide specific error messages based on error codes
            let errorMessage = `Failed to upload to S3: ${error.message}`;

            switch (error.code) {
                case 'SignatureDoesNotMatch':
                    errorMessage = 'AWS credentials are invalid or expired. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
                    break;
                case 'NoSuchBucket':
                    errorMessage = `S3 bucket "${this.bucketName}" does not exist or is not accessible.`;
                    break;
                case 'AccessDenied':
                    errorMessage = 'Access denied. Please check your AWS IAM permissions for S3 operations.';
                    break;
                case 'InvalidAccessKeyId':
                    errorMessage = 'Invalid AWS Access Key ID. Please verify your credentials.';
                    break;
                case 'TokenRefreshRequired':
                    errorMessage = 'AWS security token has expired. Please refresh your credentials.';
                    break;
                default:
                    break;
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Upload multiple community media files
     */
    async uploadMultipleCommunityMedia(
        userId: string,
        filesData: Array<{ buffer: Buffer; filename: string; mimeType: string }>
    ): Promise<Array<{ url: string; size: number; mimeType: string }>> {
        try {

            // Validate input
            if (!filesData || filesData.length === 0) {
                throw new Error('No files provided for upload');
            }

            if (filesData.length > 10) {
                throw new Error('Maximum 10 files allowed per upload');
            }

            const uploadPromises = filesData.map((fileData, index) => {
                return this.uploadCommunityMedia(userId, fileData);
            });

            const results = await Promise.all(uploadPromises);

            return results;

        } catch (error: any) {
            console.error('❌ Multiple upload error:', error.message);
            console.error('Error details:', error);
            throw new Error(`Failed to upload multiple files: ${error.message}`);
        }
    }

    /**
     * Delete community media file
     */
    async deleteCommunityMedia(mediaUrl: string): Promise<void> {
        try {
            // Extract key from URL
            const url = new URL(mediaUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();

        } catch (error: any) {
            throw new Error(`Failed to delete media: ${error.message}`);
        }
    }

    /**
     * Delete multiple community media files
     */
    async deleteMultipleCommunityMedia(mediaUrls: string[]): Promise<void> {
        try {

            if (!mediaUrls || mediaUrls.length === 0) {
                return;
            }

            // Delete files concurrently
            const deletePromises = mediaUrls.map(url => this.deleteCommunityMedia(url));
            await Promise.all(deletePromises);


        } catch (error: any) {
            console.error('❌ Multiple delete error:', error);
            // Don't throw error for delete operations - just log it
            console.warn('Some files may not have been deleted');
        }
    }

    /**
     * Test S3 connection and permissions
     */
    async testConnection(): Promise<boolean> {
        try {

            // Test 1: List buckets (credential test)
            const buckets = await this.s3.listBuckets().promise();

            // Test 2: Check target bucket
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();

            // Test 3: Test upload/delete permissions
            const testKey = `test-connection-${Date.now()}.txt`;
            await this.s3.upload({
                Bucket: this.bucketName,
                Key: testKey,
                Body: 'Connection test',
                ContentType: 'text/plain'
            }).promise();

            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: testKey
            }).promise();

            return true;

        } catch (error: any) {
            console.error('❌ S3 connection test failed:', error.message);
            return false;
        }
    }
}