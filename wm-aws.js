/*
  PARAMS:
  Bucket_Name: AWS S3 Bucket Name
  Region_Name: AWS Region Value
  Artefacts_Path: Local Path of artefacts which needs to uploaded
  AWS_Path: Location in S3 bucket where the files need to be uploaded // TODO

  FLOW:
  #0. Get Credentials
  #1. Clear the bucket
  #2. Set as Web Server
  #3. Set Public Access Settings
  #4. Set Bucket Policy
  #5. Upload Files
*/

const bucket_name = process.env.S3_BUCKET_NAME;
const region_name = process.env.S3_REGION;
const bundle_path = process.env.BUNDLE_PATH;

const path = require(`path`);

const { getAWSCredentials, deleteObjects, putBucketWebsite, putPublicAccessBlock, putBucketPolicy, putObjects } = require("./s3-api");
(async () => {
  
  
  try {
    console.log(`${bucket_name} | ${region_name} | ${bundle_path}`)  
    if(!bucket_name || !region_name || !bundle_path){
      process.exitCode = 1;  
      throw `
        Please ensure Follow ENV variables are set
        * S3_BUCKET_NAME /* amazon s3 bucketname */
        * S3_REGION      /* amazon s3 bucket region name */
        * BUNCLE_PATH    /* localtion of output bundle eg. dist/ */`
        
    }
    const artefacts_path = path.resolve(`${__dirname}/${bundle_path}`);
    const s3 = await getAWSCredentials(region_name);
    if (!s3) {
    } else {
      await deleteObjects(s3, bucket_name);
      await putBucketWebsite(s3, bucket_name);
      await putPublicAccessBlock(s3, bucket_name);
      await putBucketPolicy(s3, bucket_name);
      await putObjects(s3, bucket_name, artefacts_path);
    }
  } catch (e) {
    console.log(`ERROR | ${e}`);
  }
})();
