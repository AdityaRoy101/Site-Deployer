import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadDir = (s3Path, bucketName, dirPath) => {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      uploadDir(`${s3Path}/${file}`, bucketName, filePath);
    } else {
      const content = fs.readFileSync(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      s3Config.putObject({
        Bucket: bucketName,
        Key: `${s3Path}/${file}`,
        Body: content,
        ContentType: contentType,
      }).promise();
    }
  });
};

const uploadToS3 = async (buildPath, projectName) => {
  uploadDir(projectName, 'infraless-static-sites-bucket', buildPath);
};

export default uploadToS3;