import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import mime = require('mime-types');

@Injectable()
export class S3Helper {
  protected s3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION,
    });
  }

  async uploadFile(
    file: Express.Multer.File | Buffer,
    fileName: string,
    acl: string,
    customName = null,
  ) {
    const date = new Date();

    let params: { Bucket: string; Key: string; Body: any; ACL: string };
    let extension;
    if (Buffer.isBuffer(file)) {
      params = {
        Bucket: process.env.AWS_BUCKET,
        Key:
          fileName +
          '-' +
          date.toISOString().slice(0, 10) +
          '-' +
          date.getHours() +
          '-' +
          date.getMinutes() +
          '-' +
          date.getSeconds() +
          '-' +
          date.getMilliseconds() +
          '.webp',
        Body: file,
        ACL: acl,
      };

      extension = 'webp';
    } else {
      params = {
        Bucket: process.env.AWS_BUCKET,
        Key:
          fileName +
          '-' +
          date.toISOString().slice(0, 10) +
          '-' +
          date.getHours() +
          '-' +
          date.getMinutes() +
          '-' +
          date.getSeconds() +
          '-' +
          date.getMilliseconds() +
          '.' +
          mime.extension(file.mimetype),
        Body: file.buffer,
        ACL: acl,
      };

      const path = require('path');
      extension = path.extname(file.originalname).substring(1);
    }

    if (customName !== null) {
      params.Key = fileName + '-' + customName + '.' + extension;
    }

    return this.s3
      .upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          throw new Error(err.message);
        }
        return data;
      })
      .promise()
      .then((data) => data);
  }

  async deleteFile(filePath: string) {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: filePath,
    };

    return this.s3
      .deleteObject(params, (err, data) => {
        if (err) {
          Logger.error(err);
          throw new Error(err.message);
        }
        return data;
      })
      .promise()
      .then((data) => data);
  }
}
