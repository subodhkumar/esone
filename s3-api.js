var AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const getContentType = (filename)=>{
  return mime.lookup(filename)
}
const getAWSCredentials = async (region_name) => {
  try {
    return new Promise((resolve, reject) => {
      AWS.config.getCredentials(async function (err) {
        if (err) {
          console.log(err.stack);
          resolve(null);
        } else {
          // console.log("Access key:", AWS.config.credentials.accessKeyId);
          // console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
          AWS.config.update({ region: region_name });
          const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
          resolve(s3);
        }
      });
    });
  } catch (e) {
    resolve(null);
  }
};
const getBucketAcl = (s3, bucket_name) => {
  s3.getBucketAcl({ Bucket: bucket_name }, (err, data) => {
    if (err) {
      console.log(`ERR | GET_BUCKET_ACL | ${err}`);
    } else {
      console.log(`SUCCESS | GET_BUCKET_ACL | ${JSON.stringify(data.Grants)}`);
    }
  });
};
const getBucketWebsite = (s3, bucket_name) => {
  s3.getBucketWebsite({ Bucket: bucket_name }, (err, data) => {
    if (err) {
      console.log(`ERR | ${err}`);
    } else {
      console.log(`SUCCESS | ${JSON.stringify(data)}`);
    }
  });
};
const getBucketPolicy = (s3, bucket_name) => {
  s3.getBucketPolicy({ Bucket: bucket_name }, (err, data) => {
    if (err) {
      console.error(`ERROR | GET_BUCKET_POLICY | ${err}`);
    } else if (data) {
      console.log(`SUCCESS | GET_BUCKET_POLICY | ${JSON.stringify(data)}`);
    }
  });
};
const getPublicAccessBlock = (s3, bucket_name) => {
  s3.getPublicAccessBlock({ Bucket: bucket_name }, (err, data) => {
    if (err) {
      console.log(`ERROR | GET_PUBLIC_ACCESS_BLOCK | ${err}`);
    } else if (data) {
      console.log(
        `SUCCESS | GET_PUBLIC_ACCESS_BLOCK | ${JSON.stringify(data)}`
      );
    }
  });
};
const listBuckets = (s3) => {
  return new Promise((resolve, reject) => {
    s3.listBuckets((err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log(`SUCCESS | LIST_BUCKETS `);
        console.log(data.Buckets);
        resolve(data.Buckets);
      }
    });
  });
};
const listObjects = (s3, bucket_name) => {
  console.log(`LIST_OBJECTS`);
  return new Promise((resolve, reject) => {
    s3.listObjects({ Bucket: bucket_name }, (err, data) => {
      if (err) {
        console.log(`ERROR | LIST_OBJECTS | ${err}`);
        reject(err);
      } else {
        console.log(`SUCCESS | LIST_OBJECTS | ${JSON.stringify(data)}`);
        resolve(data);
      }
    });
  });
};
const putBucketWebsite = (s3, bucket_name) => {
  return new Promise((resolve, reject) => {
    const staticHostParams = {
      Bucket: bucket_name,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: `index.html`,
        },
        IndexDocument: {
          Suffix: `index.html`,
        },
      },
    };
    s3.putBucketWebsite(staticHostParams, (err, data) => {
      if (err) {
        console.log(`ERROR | PUT_BUCKET_WEBSITE | ${err}`);
        reject(err);
      } else if (data) {
        console.log(`SUCCESS | PUT_BUCKET_WEBSITE | ${JSON.stringify(data)}`);
        resolve(data);
      }
    });
  });
};
const putPublicAccessBlock = (s3, bucket_name) => {
  return new Promise((resolve, reject) => {
    const publicAccessBlockJson = {
      Bucket: bucket_name,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    };

    s3.putPublicAccessBlock(publicAccessBlockJson, (err, data) => {
      if (err) {
        console.log(`ERROR | PUT_PUBLIC_ACCESS_BLOCK | ${err}`);
        reject(err);
      } else if (data) {
        console.log(
          `SUCCESS | PUT_PUBLIC_ACCESS_BLOCK | ${JSON.stringify(data)}`
        );
        resolve(data);
      }
    });
  });
};
const putBucketPolicy = (s3, bucket_name) => {
  return new Promise((resolve, reject) => {
    const readOnlyAnonUserPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AddPerm",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: ["arn:aws:s3:::" + bucket_name + "/*"],
        },
      ],
    };
    const bucketPolicyParams = {
      Bucket: bucket_name,
      Policy: JSON.stringify(readOnlyAnonUserPolicy),
    };
    s3.putBucketPolicy(bucketPolicyParams, (err, data) => {
      if (err) {
        console.log(`ERROR | PUT_BUCKET_POLICY | ${err}`);
        reject(err);
      } else if (data) {
        console.log(`SUCCESS | PUT_BUCKET_POLICY | ${JSON.stringify(data)}`);
        resolve(data);
      }
    });
  });
};
const _putFiles = async (s3, bucket_name, artefacts_path, file_path) => {
  const fileName = file_path.substr(artefacts_path.length + 1);
  console.log(`SUCCESS | UPLOAD FILES | ${fileName} `);
  let params = {
    Bucket: bucket_name,
    Key: fileName,
    Body: fs.readFileSync(file_path),
    ContentType: getContentType(file_path)
  };
  try {
    await s3.upload(params).promise();
  } catch (error) {
    console.error(`Error in uploading ${fileName} to S3 Bucket | ${error}`);
  }
};
const putObjects = async (
  s3,
  bucket_name,
  artefacts_path,
  relative_path = ""
) => {
  try {
    const fullPath = relative_path || artefacts_path;
    fs.readdirSync(fullPath).forEach(async (fileName) => {
      const filePath = path.join(fullPath, fileName);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        _putFiles(s3, bucket_name, artefacts_path, filePath);
      } else {
        console.log(`FOLDER | ${filePath}`);
        await putObjects(s3, bucket_name, artefacts_path, filePath);
      }
    });
  } catch (e) {
    console.log(`ERROR | ${e}`);
  }
};
const deleteObjects = async (s3, bucket_name) => {
  return new Promise((resolve, reject) => {
    s3.listObjects({ Bucket: bucket_name }, (err, data) => {
      if (err) {
        console.log(`ERROR | CLEAR_OBJECT | LIST | ${err}`);
        reject(err);
      } else if (data) {
        const keyList = data.Contents.map((content) => ({ Key: content.Key }));
        if (keyList.length) {
          // Prepare Param
          const params = {
            Bucket: bucket_name,
            Delete: {
              Objects: keyList,
              Quiet: false,
            },
          };
          s3.deleteObjects(params, (err, data) => {
            if (err) {
              console.log(`ERROR | DELETE_OBJECTS | ${err}`);
              reject(err);
            } else if (data) {
              console.log(`SUCCESS | DELETE_OBJECTS `);
            }
            resolve();
          });
        } else {
          resolve();
        }
      }
    });
  });
};
const deleteBucketPolicy = (s3, bucket_name) => {
  s3.deleteBucketPolicy({ Bucket: bucket_name }, (err, data) => {
    if (err) {
      console.log(`ERROR | DELETE_BUCKET_POLICY | ${err}`);
    } else if (data) {
      console.log(`SUCCESS | DELETE_BUCKET_POLICY | ${JSON.stringify(data)}`);
    }
  });
};

module.exports = {
  getAWSCredentials,
  deleteObjects,
  putBucketWebsite,
  putPublicAccessBlock,
  putBucketPolicy,
  putObjects,
};
