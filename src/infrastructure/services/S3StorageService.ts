// backend/src/infrastructure/services/S3StorageService.ts

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class S3StorageService {
    private s3: AWS.S3;
    private bucketName: string;

    constructor() {
        // Configure AWS with explicit configuration
        const awsConfig = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            signatureVersion: 'v4', // Important for newer AWS regions
        };

        console.log('Initializing S3StorageService with config:', {
            region: awsConfig.region,
            hasAccessKey: !!awsConfig.accessKeyId,
            hasSecretKey: !!awsConfig.secretAccessKey,
            signatureVersion: awsConfig.signatureVersion
        });

        // Update AWS global configuration
        AWS.config.update(awsConfig);

        this.s3 = new AWS.S3({
            ...awsConfig,
            // Force path-style URLs if needed
            s3ForcePathStyle: false,
            // Set explicit endpoint if using custom S3-compatible service
            // endpoint: 'https://s3.amazonaws.com', // Uncomment if needed
        });

        this.bucketName = process.env.AWS_S3_BUCKET_NAME!;

        if (!this.bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
        }

        console.log('S3StorageService initialized successfully');
    }

    /**
     * Sanitize filename to avoid encoding issues with special characters
     */
    private sanitizeFilename(originalName: string): string {
        console.log('Original filename:', originalName);

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
                console.log('Detected encoding issues, generating safe filename');
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

            console.log('Sanitized filename:', sanitized);
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
            console.log('=== Profile Photo Upload Starting ===');
            console.log('User ID:', userId);
            console.log('File size:', fileBuffer.length, 'bytes');
            console.log('MIME type:', mimeType);

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
            console.log('Generated safe filename:', safeFilename);

            // Create S3 key with folder structure
            const key = `profiles/${userId}/${safeFilename}`;
            console.log('S3 key:', key);

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

            console.log('Upload parameters:', {
                Bucket: uploadParams.Bucket,
                Key: uploadParams.Key,
                ContentType: uploadParams.ContentType,
                BufferSize: fileBuffer.length,
                ACL: uploadParams.ACL
            });

            // Perform S3 upload
            console.log('Starting S3 upload...');
            const result = await this.s3.upload(uploadParams).promise();

            console.log('✅ Profile photo upload successful!');
            console.log('File URL:', result.Location);
            console.log('ETag:', result.ETag);

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
                console.log('No photo URL provided for deletion');
                return;
            }

            console.log('Deleting old profile photo:', photoUrl);

            // Extract key from URL
            const url = new URL(photoUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            console.log('Extracted S3 key:', key);

            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();
            console.log('✅ Old profile photo deleted successfully');

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
            console.log('=== S3 Upload Starting ===');
            console.log('User ID:', userId);
            console.log('Original filename:', fileData.filename);
            console.log('File size:', fileData.buffer.length, 'bytes');
            console.log('MIME type:', fileData.mimeType);

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
            console.log('Generated safe filename:', safeFilename);

            // Create S3 key with folder structure
            const key = `community/${userId}/${safeFilename}`;
            console.log('S3 key:', key);

            // Log current AWS configuration (without sensitive data)
            console.log('AWS S3 Config Check:', {
                region: AWS.config.region,
                bucket: this.bucketName,
                hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
                hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
                accessKeyLength: process.env.AWS_ACCESS_KEY_ID?.length,
                secretKeyLength: process.env.AWS_SECRET_ACCESS_KEY?.length,
                signatureVersion: this.s3.config.signatureVersion
            });

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

            console.log('Upload parameters:', {
                Bucket: uploadParams.Bucket,
                Key: uploadParams.Key,
                ContentType: uploadParams.ContentType,
                BufferSize: uploadParams.Body instanceof Buffer ? uploadParams.Body.length : 'Unknown',
                ACL: uploadParams.ACL
            });

            // Perform S3 upload
            console.log('Starting S3 upload...');
            const result = await this.s3.upload(uploadParams).promise();

            console.log('✅ S3 upload successful!');
            console.log('File URL:', result.Location);
            console.log('ETag:', result.ETag);

            return {
                url: result.Location,
                size: fileData.buffer.length,
                mimeType: fileData.mimeType,
            };

        } catch (error: any) {
            console.error('❌ S3 Upload Error Details:');
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Status code:', error.statusCode);
            console.error('Request ID:', error.requestId);
            console.error('Extended Request ID:', error.extendedRequestId);
            console.error('Region:', error.region);
            console.error('Time:', error.time);
            console.error('Stack:', error.stack);

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
            console.log(`=== Multiple Upload Starting ===`);
            console.log(`User ID: ${userId}`);
            console.log(`Number of files: ${filesData.length}`);

            // Validate input
            if (!filesData || filesData.length === 0) {
                throw new Error('No files provided for upload');
            }

            if (filesData.length > 10) {
                throw new Error('Maximum 10 files allowed per upload');
            }

            // Log file details
            filesData.forEach((fileData, index) => {
                console.log(`File ${index + 1}:`, {
                    filename: fileData.filename,
                    size: fileData.buffer.length,
                    type: fileData.mimeType
                });
            });

            // Upload all files concurrently
            console.log('Starting concurrent uploads...');
            const uploadPromises = filesData.map((fileData, index) => {
                console.log(`Initiating upload ${index + 1}/${filesData.length}: ${fileData.filename}`);
                return this.uploadCommunityMedia(userId, fileData);
            });

            const results = await Promise.all(uploadPromises);

            console.log('✅ All uploads completed successfully!');
            console.log('Uploaded URLs:', results.map(r => r.url));

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
            console.log('Deleting media file:', mediaUrl);

            // Extract key from URL
            const url = new URL(mediaUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            console.log('Extracted S3 key:', key);

            const deleteParams: AWS.S3.DeleteObjectRequest = {
                Bucket: this.bucketName,
                Key: key
            };

            await this.s3.deleteObject(deleteParams).promise();
            console.log('✅ File deleted successfully');

        } catch (error: any) {
            console.error('❌ Delete error:', error);
            throw new Error(`Failed to delete media: ${error.message}`);
        }
    }

    /**
     * Delete multiple community media files
     */
    async deleteMultipleCommunityMedia(mediaUrls: string[]): Promise<void> {
        try {
            console.log('Deleting multiple media files:', mediaUrls.length);

            if (!mediaUrls || mediaUrls.length === 0) {
                return;
            }

            // Delete files concurrently
            const deletePromises = mediaUrls.map(url => this.deleteCommunityMedia(url));
            await Promise.all(deletePromises);

            console.log('✅ All files deleted successfully');

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
            console.log('Testing S3 connection...');

            // Test 1: List buckets (credential test)
            const buckets = await this.s3.listBuckets().promise();
            console.log('✅ Credentials valid. Available buckets:', buckets.Buckets?.map(b => b.Name));

            // Test 2: Check target bucket
            await this.s3.headBucket({ Bucket: this.bucketName }).promise();
            console.log(`✅ Bucket "${this.bucketName}" is accessible`);

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

            console.log('✅ Upload/Delete permissions confirmed');
            return true;

        } catch (error: any) {
            console.error('❌ S3 connection test failed:', error.message);
            return false;
        }
    }
}